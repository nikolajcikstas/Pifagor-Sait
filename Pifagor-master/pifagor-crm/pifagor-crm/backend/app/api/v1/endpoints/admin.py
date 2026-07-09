import secrets
from typing import List, Optional
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, cast, Date
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from pydantic import BaseModel  # 🌟 Добавили для Pydantic схемы

from app.db.session import get_db
from app.core.deps import require_admin
from app.models.models import (
    Act, ChildProfile, Comment, EmailReceipt, Homework, InviteCode,
    Lesson, LessonStatus, Material, Notification, ParentChild,
    ParentContract, ParentProfile, Payment, Report, Review,
    RoleEnum, Subject, Test, TestResult, TutorContract,
    TutorProfile, TutorSubject, User,
)
from app.schemas.schemas import (
    InviteCodeCreate, InviteCodeResponse,
    EmailReceiptOut, StudentFinanceRow,
)

router = APIRouter()


# Pydantic схема для ручного бинда
class BaseParentChildLink(BaseModel):
    parent_id: int
    child_id: int


def generate_random_code(prefix: str) -> str:
    return f"PIF-{prefix.upper()}-{secrets.token_hex(3).upper()}"


@router.post("/invite-codes", response_model=List[InviteCodeResponse])
async def create_invite_codes(payload: InviteCodeCreate, db: AsyncSession = Depends(get_db)):
    role_str = str(payload.role).strip().lower()

    if role_str in ["pair", "student_parent"]:
        child_code = generate_random_code("CHD")
        child_invite = InviteCode(role=RoleEnum.child, code=child_code, description=payload.description)
        db.add(child_invite)
        await db.flush()

        parent_code = generate_random_code("PRN")
        parent_invite = InviteCode(
            role=RoleEnum.parent,
            code=parent_code,
            description=payload.description,
            linked_code_id=child_invite.id
        )
        db.add(parent_invite)
        await db.commit()
        return [child_invite, parent_invite]

    if role_str == "tutor":
        code_str = generate_random_code("TUT")
        invite = InviteCode(role=RoleEnum.tutor, code=code_str, description=payload.description)
        db.add(invite)
        await db.commit()
        return [invite]

    raise HTTPException(status_code=400, detail=f"Неверная роль для генерации кода: {payload.role}")


@router.get("/invite-codes", response_model=List[InviteCodeResponse])
async def list_invite_codes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InviteCode).order_by(InviteCode.created_at.desc()))
    return result.scalars().all()


# ─── Email Receipts ────────────────────────────────────────────────────────────

@router.get("/receipts", response_model=List[EmailReceiptOut], dependencies=[Depends(require_admin)])
async def list_receipts(db: AsyncSession = Depends(get_db)):
    """List all parsed email receipts (admin only)."""
    result = await db.execute(
        select(EmailReceipt)
        .options(joinedload(EmailReceipt.child).joinedload(ChildProfile.user))
        .order_by(EmailReceipt.payment_date.desc())
    )
    receipts = result.scalars().unique().all()
    output = []
    for r in receipts:
        student_name = None
        if r.child and r.child.user:
            u = r.child.user
            student_name = f"{u.last_name} {u.first_name}".strip()
        output.append(EmailReceiptOut(
            id=r.id,
            receipt_number=r.receipt_number,
            payer_name=r.payer_name,
            amount=r.amount,
            payment_date=r.payment_date,
            child_id=r.child_id,
            student_name=student_name,
            created_at=r.created_at,
        ))
    return output


@router.post("/receipts/parse-emails", dependencies=[Depends(require_admin)])
async def trigger_email_parsing(db: AsyncSession = Depends(get_db)):
    """Manually trigger email inbox parsing for new EasyPay receipts."""
    from app.services.email_parser import run_email_parse
    count = await run_email_parse(db)
    return {"new_receipts": count, "message": f"Обработано новых чеков: {count}"}


# ─── Finance Report ────────────────────────────────────────────────────────────

@router.get("/finance-report", response_model=List[StudentFinanceRow], dependencies=[Depends(require_admin)])
async def finance_report(
        week_start: Optional[date] = Query(None),
        db: AsyncSession = Depends(get_db),
):
    """Weekly finance report per student."""
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    # Completed lessons in the week
    lessons_res = await db.execute(
        select(Lesson.child_id, func.count(Lesson.id).label("cnt"))
        .where(
            Lesson.status == LessonStatus.completed,
            Lesson.date >= week_start,
            Lesson.date <= week_end,
        )
        .group_by(Lesson.child_id)
    )
    lessons_by_child = {row.child_id: row.cnt for row in lessons_res}

    # Paid receipts in the week (cast datetime to date for correct comparison)
    receipts_res = await db.execute(
        select(EmailReceipt.child_id, func.sum(EmailReceipt.amount).label("total"))
        .where(
            EmailReceipt.child_id.isnot(None),
            cast(EmailReceipt.payment_date, Date) >= week_start,
            cast(EmailReceipt.payment_date, Date) <= week_end,
        )
        .group_by(EmailReceipt.child_id)
    )
    amounts_by_child = {row.child_id: row.total for row in receipts_res}

    all_child_ids = set(lessons_by_child) | set(amounts_by_child)

    if not all_child_ids:
        return []

    cp_res = await db.execute(
        select(ChildProfile)
        .options(joinedload(ChildProfile.user))
        .where(ChildProfile.id.in_(all_child_ids))
    )
    children = {cp.id: cp for cp in cp_res.scalars().unique()}

    from app.services.email_parser import LESSON_PRICE

    rows: List[StudentFinanceRow] = []
    for child_id in sorted(all_child_ids):
        cp = children.get(child_id)
        if not cp or not cp.user:
            continue
        u = cp.user
        conducted = lessons_by_child.get(child_id, 0)
        amount_paid = amounts_by_child.get(child_id, 0.0) or 0.0
        lessons_paid = int(amount_paid // LESSON_PRICE) if LESSON_PRICE else 0

        rows.append(StudentFinanceRow(
            child_id=child_id,
            student_name=f"{u.last_name} {u.first_name}".strip(),
            lessons_conducted=conducted,
            lessons_paid=lessons_paid,
            amount_paid=round(amount_paid, 2),
        ))

    return rows


# ─── Ручная привязка Родитель ↔ Ребёнок ────────────────────────────────────────

@router.post("/parent-child/bind", dependencies=[Depends(require_admin)])
async def bind_parent_to_child(payload: BaseParentChildLink, db: AsyncSession = Depends(get_db)):
    """Вручную связать существующего родителя и ребёнка по ID их профилей (Admin only)."""

    # 1. Проверяем, существует ли родитель
    parent_res = await db.execute(select(ParentProfile).where(ParentProfile.id == payload.parent_id))
    parent = parent_res.scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail=f"Профиль родителя с ID {payload.parent_id} не найден")

    # 2. Проверяем, существует ли ребёнок
    child_res = await db.execute(select(ChildProfile).where(ChildProfile.id == payload.child_id))
    child = child_res.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail=f"Профиль ребёнка с ID {payload.child_id} не найден")

    # 3. Проверяем дубликаты связей
    exist_res = await db.execute(
        select(ParentChild).where(
            ParentChild.parent_id == payload.parent_id,
            ParentChild.child_id == payload.child_id
        )
    )
    if exist_res.scalar_one_or_none():
        return {"message": "Эта связь уже существует в базе данных"}

    # 4. Создаем запись
    new_relation = ParentChild(
        parent_id=payload.parent_id,
        child_id=payload.child_id
    )
    db.add(new_relation)
    await db.commit()

    return {
        "status": "success",
        "message": f"Родитель (ID {payload.parent_id}) успешно связан с ребёнком (ID {payload.child_id})"
    }


# ─── Admin Tutor CRUD ─────────────────────────────────────────────────────────

class AdminTutorUpdatePayload(BaseModel):
    bio: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[int] = None
    rate_per_hour: Optional[float] = None
    is_published: Optional[bool] = None
    subject_ids: Optional[List[int]] = None
    user: Optional[dict] = None


@router.get("/tutors")
async def list_admin_tutors(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    from sqlalchemy.orm import joinedload as _jl

    result = await db.execute(
        select(TutorProfile)
        .options(
            _jl(TutorProfile.user),
            _jl(TutorProfile.subjects).joinedload(TutorSubject.subject),
        )
        .order_by(TutorProfile.id)
    )
    tutors = result.scalars().unique().all()
    output = []
    for t in tutors:
        u = t.user
        output.append({
            "id": t.id,
            "bio": t.bio,
            "education": t.education,
            "experience_years": t.experience_years,
            "rate_per_hour": t.rate_per_hour,
            "is_published": t.is_published,
            "user": {
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "avatar_url": u.avatar_url,
            },
            "subjects": [
                {
                    "id": ts.subject.id,
                    "name": ts.subject.name,
                    "slug": ts.subject.slug,
                }
                for ts in t.subjects
            ],
        })
    return output


@router.patch("/tutors/{tutor_id}")
async def update_admin_tutor(
    tutor_id: int,
    data: AdminTutorUpdatePayload,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    from sqlalchemy.orm import joinedload as _jl

    result = await db.execute(
        select(TutorProfile)
        .options(
            _jl(TutorProfile.user),
            _jl(TutorProfile.subjects).joinedload(TutorSubject.subject),
        )
        .where(TutorProfile.id == tutor_id)
    )
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")

    if data.bio is not None:
        tutor.bio = data.bio
    if data.education is not None:
        tutor.education = data.education
    if data.experience_years is not None:
        tutor.experience_years = data.experience_years
    if data.rate_per_hour is not None:
        tutor.rate_per_hour = data.rate_per_hour
    if data.is_published is not None:
        tutor.is_published = data.is_published

    if data.subject_ids is not None:
        existing = await db.execute(
            select(TutorSubject).where(TutorSubject.tutor_id == tutor_id)
        )
        for ts in existing.scalars().all():
            await db.delete(ts)

        for sid in data.subject_ids:
            db.add(TutorSubject(tutor_id=tutor_id, subject_id=sid))

    if data.user:
        u = tutor.user
        if "first_name" in data.user and data.user["first_name"] is not None:
            u.first_name = data.user["first_name"]
        if "last_name" in data.user and data.user["last_name"] is not None:
            u.last_name = data.user["last_name"]
        if "avatar_url" in data.user:
            u.avatar_url = data.user["avatar_url"]

    await db.commit()
    await db.refresh(tutor)

    u = tutor.user
    return {
        "id": tutor.id,
        "bio": tutor.bio,
        "education": tutor.education,
        "experience_years": tutor.experience_years,
        "rate_per_hour": tutor.rate_per_hour,
        "is_published": tutor.is_published,
        "user": {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "avatar_url": u.avatar_url,
        },
        "subjects": [
            {
                "id": ts.subject.id,
                "name": ts.subject.name,
                "slug": ts.subject.slug,
            }
            for ts in tutor.subjects
        ],
    }


@router.delete("/tutors/{tutor_id}", status_code=204)
async def delete_admin_tutor(
    tutor_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(TutorProfile).where(TutorProfile.id == tutor_id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise HTTPException(status_code=404, detail="Репетитор не найден")

    # 1. Homeworks (via lessons)
    lessons = await db.execute(select(Lesson).where(Lesson.tutor_id == tutor_id))
    for lesson in lessons.scalars().all():
        hws = await db.execute(select(Homework).where(Homework.lesson_id == lesson.id))
        for hw in hws.scalars().all():
            await db.delete(hw)
        await db.delete(lesson)

    # 2. Reports
    reports = await db.execute(select(Report).where(Report.tutor_id == tutor_id))
    for r in reports.scalars().all():
        await db.delete(r)

    # 3. Materials
    materials = await db.execute(select(Material).where(Material.tutor_id == tutor_id))
    for m in materials.scalars().all():
        await db.delete(m)

    # 4. TutorContracts
    contracts = await db.execute(select(TutorContract).where(TutorContract.tutor_id == tutor_id))
    for c in contracts.scalars().all():
        await db.delete(c)

    # 5. Comments
    comments = await db.execute(select(Comment).where(Comment.tutor_id == tutor_id))
    for c in comments.scalars().all():
        await db.delete(c)

    # 6. Acts
    acts = await db.execute(select(Act).where(Act.tutor_id == tutor_id))
    for a in acts.scalars().all():
        await db.delete(a)

    # 7. Tests (results + cascade questions/answers)
    tests = await db.execute(select(Test).where(Test.tutor_id == tutor_id))
    for t in tests.scalars().all():
        results = await db.execute(select(TestResult).where(TestResult.test_id == t.id))
        for tr in results.scalars().all():
            await db.delete(tr)
        await db.delete(t)

    # 8. Reviews — set tutor_id to NULL (nullable FK)
    reviews = await db.execute(select(Review).where(Review.tutor_id == tutor_id))
    for r in reviews.scalars().all():
        r.tutor_id = None

    # 9. TutorSubjects
    subjects = await db.execute(
        select(TutorSubject).where(TutorSubject.tutor_id == tutor_id)
    )
    for ts in subjects.scalars().all():
        await db.delete(ts)

    # 10. User cleanup (notifications, invite codes)
    user = tutor.user
    notifs = await db.execute(select(Notification).where(Notification.user_id == user.id))
    for n in notifs.scalars().all():
        await db.delete(n)
    codes = await db.execute(select(InviteCode).where(InviteCode.used_by_user_id == user.id))
    for c in codes.scalars().all():
        c.used_by_user_id = None

    # 11. TutorProfile + User
    await db.delete(tutor)
    await db.delete(user)
    await db.commit()


@router.delete("/students/{user_id}", status_code=204)
async def delete_admin_student(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id, User.role == "child"))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Ученик не найден")

    result = await db.execute(select(ChildProfile).where(ChildProfile.user_id == user_id))
    child = result.scalar_one_or_none()

    if not child:
        await db.delete(user)
        await db.commit()
        return

    child_id = child.id

    # 1. ParentChild links
    parent_links = await db.execute(
        select(ParentChild).where(ParentChild.child_id == child_id)
    )
    for link in parent_links.scalars().all():
        await db.delete(link)

    # 2. Homeworks (via lessons)
    lessons = await db.execute(select(Lesson).where(Lesson.child_id == child_id))
    for lesson in lessons.scalars().all():
        hws = await db.execute(select(Homework).where(Homework.lesson_id == lesson.id))
        for hw in hws.scalars().all():
            await db.delete(hw)
        await db.delete(lesson)

    # 3. Reports
    reports = await db.execute(select(Report).where(Report.child_id == child_id))
    for r in reports.scalars().all():
        await db.delete(r)

    # 4. Materials
    materials = await db.execute(select(Material).where(Material.child_id == child_id))
    for m in materials.scalars().all():
        await db.delete(m)

    # 5. Homeworks (direct link)
    homeworks = await db.execute(select(Homework).where(Homework.child_id == child_id))
    for hw in homeworks.scalars().all():
        await db.delete(hw)

    # 6. ParentContracts
    pcontracts = await db.execute(select(ParentContract).where(ParentContract.child_id == child_id))
    for pc in pcontracts.scalars().all():
        await db.delete(pc)

    # 7. Payments
    payments = await db.execute(select(Payment).where(Payment.child_id == child_id))
    for p in payments.scalars().all():
        await db.delete(p)

    # 8. Comments
    comments = await db.execute(select(Comment).where(Comment.child_id == child_id))
    for c in comments.scalars().all():
        await db.delete(c)

    # 9. TestResults
    test_results = await db.execute(select(TestResult).where(TestResult.child_id == child_id))
    for tr in test_results.scalars().all():
        await db.delete(tr)

    # 10. EmailReceipts — set child_id to NULL
    receipts = await db.execute(select(EmailReceipt).where(EmailReceipt.child_id == child_id))
    for r in receipts.scalars().all():
        r.child_id = None

    # 11. ChildProfile + User
    await db.delete(child)
    await db.delete(user)
    await db.commit()