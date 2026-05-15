import React from 'react';
import { Phone, Calendar, User, Shield, Activity, Flag, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const LeftWave = () => (
  <div className="absolute left-0 top-0 h-full w-[120px] overflow-hidden pointer-events-none">
    <svg width="120" height="100%" viewBox="0 0 120 400" preserveAspectRatio="none">
      <path d="M0,0 L80,0 C60,100 110,250 50,400 L0,400 Z" fill="#274a2eff" />
    </svg>
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
  </div>
);

export const BackgroundPattern = () => (
  <>
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B4332 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-[30px] border-[#1B4332]/5 border-double pointer-events-none" />
    <div className="absolute bottom-0 left-0 right-0 h-[60px] opacity-10 pointer-events-none bg-repeat-x" style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 20\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M0,20 L0,15 L5,15 L5,10 L10,10 L10,18 L15,18 L15,5 L20,5 L20,15 L25,15 L25,8 L30,8 L30,19 L35,19 L35,12 L40,12 L40,17 L45,17 L45,4 L50,4 L50,16 L55,16 L55,9 L60,9 L60,18 L65,18 L65,11 L70,11 L70,15 L75,15 L75,7 L80,7 L80,18 L85,18 L85,13 L90,13 L90,19 L95,19 L95,10 L100,10 L100,20 Z\' fill=\'%231B4332\'/%3E%3C/svg%3E")'
    }} />
  </>
);

export const CardLayout = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative w-[648px] h-[408px] bg-[#fdfdfc] overflow-hidden rounded-2xl shadow-xl print:shadow-none border border-gray-200 print:border-none print:break-after-page flex-shrink-0 print:m-0 ${className}`} style={{ boxSizing: 'border-box' }}>
    <BackgroundPattern />
    <LeftWave />
    {children}
  </div>
);

export const CardHeader = ({ title = 'MEMBER ID CARD', subtitle }: { title?: string, subtitle?: React.ReactNode }) => (
  <div className="absolute top-6 left-[130px] pr-4 max-w-[380px]">
    <h1 className="text-3xl font-black text-[#1B4332] tracking-wider mb-1 uppercase leading-tight truncate" style={{ fontFamily: 'Impact, sans-serif' }}>
      {title}
    </h1>
    <div className="text-sm font-bold text-gray-700 tracking-widest uppercase">
      {subtitle || (
        <span className="flex items-center gap-2 text-[10px]">
          UNITY <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block"></span>
          DISCIPLINE <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>
          EXCELLENCE
        </span>
      )}
    </div>
  </div>
);

export const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-end gap-4 w-full">
    <div className="text-[#1B4332] pb-1">{icon}</div>
    <div className="w-[110px] text-[11px] font-bold text-gray-800 uppercase tracking-wider pb-1">{label}</div>
    <div className="flex-1 text-[13px] font-bold text-gray-900 border-b-2 border-gray-200 pb-1 whitespace-nowrap overflow-hidden text-ellipsis">
      {value}
    </div>
  </div>
);

export const PrintPage1Back = ({ card }: { card: any }) => {
  const getImageUrl = (path: string | undefined | null, fallbackName: string) => {
    if (!path) return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=e0e7ff&color=3730a3`;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  };

  return (
    <CardLayout>
      <CardHeader title={card?.organization?.name || 'ORGANIZATION NAME'} subtitle="MEMBER ID CARD" />

      <div className="absolute top-8 right-8 flex flex-col items-center w-[160px]">
        <div className="relative w-[80px] h-[80px] bg-white rounded-full flex items-center justify-center border-4 border-[#1B4332] mb-3 shadow-sm z-10 overflow-hidden flex-shrink-0">
          {card?.organization?.users?.[0]?.profile_photo_path ? (
            <img src={getImageUrl(card.organization.users[0].profile_photo_path, card?.organization?.name || '')} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Shield size={40} className="text-[#1B4332]" />
          )}
          <div className="absolute -left-3 -right-3 top-2 bottom-0 border-b-4 border-l-4 border-r-4 border-green-700 rounded-b-full rounded-t-xl opacity-30 pointer-events-none" />
        </div>
        <div className="bg-[#1B4332] text-white text-[9px] font-bold px-4 py-1.5 rounded-full text-center shadow-md w-full truncate relative z-20">
          {card?.organization?.name?.toUpperCase() || 'YOUR ORGANIZATION'}
        </div>
      </div>

      <div className="absolute top-[140px] left-[130px] w-[340px] flex flex-col gap-5">
        <DetailRow icon={<Phone size={18} />} label="PHONE NUMBER" value={card?.user?.phone || 'N/A'} />
        <DetailRow icon={<Calendar size={18} />} label="DATE OF ISSUE" value={card?.generatedAt ? new Date(card.generatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'} />
        <DetailRow icon={<Calendar size={18} />} label="EXPIRATION DATE" value={card?.expiresAt ? new Date(card.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'} />
        <DetailRow icon={<User size={18} />} label="MEMBER ID" value={card?.cardNumber || 'N/A'} />
      </div>

      <div className="absolute bottom-8 right-12 flex flex-col items-center">
        <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm mb-2 z-10">
          {card?.qrToken && <QRCodeSVG value={`${window.location?.origin || 'http://localhost:5173'}/verify/${card.qrToken}`} size={90} level="H" />}
        </div>
        <span className="text-[10px] font-bold text-gray-700 tracking-wider bg-white/50 px-2 rounded">SCAN TO VERIFY</span>
      </div>
    </CardLayout>
  );
};

export const PrintPage2Front = ({ card }: { card: any }) => {
  const getImageUrl = (path: string | undefined | null, fallbackName: string) => {
    if (!path) return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=e0e7ff&color=3730a3`;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  };

  return (
    <CardLayout>
      <CardHeader title={card?.organization?.name || 'ORGANIZATION NAME'} subtitle="MEMBER ID CARD" />

      <div className="absolute top-6 right-8 w-[95px] h-[115px] rounded-2xl border-4 border-[#1B4332] overflow-hidden bg-gray-100 shadow-md z-10 flex-shrink-0">
        <img src={getImageUrl(card?.user?.profile_photo_path, card?.user?.name || '')} alt="Profile" className="w-full h-full object-cover object-top block" />
      </div>

      <div className="absolute top-[140px] left-[130px] w-[340px] flex flex-col gap-4">
        <DetailRow icon={<User size={18} />} label="FULL NAME" value={card?.user?.name?.toUpperCase() || 'N/A'} />
        <DetailRow icon={<Activity size={18} />} label="GENDER" value={card?.user?.sex?.toUpperCase() || 'N/A'} />
        <DetailRow icon={<Shield size={18} />} label="ROLE" value={card?.user?.role?.toUpperCase() || 'MEMBER'} />
        <DetailRow icon={<Flag size={18} />} label="NATIONALITY" value="ETHIOPIAN" />
        <DetailRow icon={<Globe size={18} />} label="COUNTRY" value={card?.user?.address?.toUpperCase() || 'ETHIOPIA'} />
      </div>

      <div className="absolute bottom-8 right-12 w-[200px] flex flex-col items-center z-10">
        <div className="w-full border-b border-gray-400 mb-2"></div>
        <span className="text-[9px] font-bold text-gray-500 tracking-wider">AUTHORIZED SIGNATURE</span>
      </div>
    </CardLayout>
  );
};
