import alexeyPetrovImg from "../assets/Alexey Petrov.png";

interface TutorCardData {
  name: string;
  subjects: string[];
  image?: string;
  university?: string;
  approach?: string;
  caseStudy?: string;
}

interface TutorCardProps {
  tutor: TutorCardData;
}

export function TutorCard({ tutor }: TutorCardProps) {
  return (
    <div
      className="tutors-page-card"
      style={{
        height: '100%',
        width: '353px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div className="tutors-page-card__photo" style={{ margin: 0, width: '100%', height: 'auto', borderRadius: '16px', overflow: 'hidden' }}>
        <img
          src={tutor.image || alexeyPetrovImg}
          alt={tutor.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 4px' }}>
        <div className="tutors-page-card__name text-h2" style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          {tutor.name}
        </div>
        {tutor.subjects.length > 0 && (
          <div className="text-h3" style={{ color: '#0369A1', fontSize: '16px', fontWeight: '600', lineHeight: '1.4' }}>
            Предмет: {tutor.subjects.join(", ")}
          </div>
        )}
      </div>

      <hr style={{ border: 0, borderTop: '1px solid #E5E7EB', margin: '4px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, padding: '0 4px' }}>
        {tutor.university && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>
              ✓
            </span>
            <p className="text-h3" style={{ margin: 0, fontSize: '17px', color: '#374151', lineHeight: '1.5' }}>
              {tutor.university}
            </p>
          </div>
        )}

        {tutor.approach && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>
              ✓
            </span>
            <p className="text-h3" style={{ margin: 0, fontSize: '17px', color: '#374151', lineHeight: '1.5' }}>
              {tutor.approach}
            </p>
          </div>
        )}

        {tutor.caseStudy && (
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>
              ✓
            </span>
            <p className="text-h3" style={{ margin: 0, fontSize: '17px', color: '#374151', lineHeight: '1.5' }}>
              {tutor.caseStudy}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
