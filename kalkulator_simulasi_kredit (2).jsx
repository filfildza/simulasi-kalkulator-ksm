import React, { useState, useMemo } from "react";
import {
  Wallet, Heart, ThumbsUp, ArrowRight, ArrowLeft, PartyPopper, Sparkles, Info, Check,
  BarChart3, X, TableProperties, LineChart as LineChartIcon, Mail, MessageCircle,
  GraduationCap, HeartHandshake, Hammer, Stethoscope, Landmark, Store, MoreHorizontal,
  Building2, Smartphone, PhoneCall, ShieldCheck, AlertTriangle, Zap, Clock, Rocket,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

// ---------------- Helpers ----------------
function rupiah(n) {
  if (!isFinite(n)) return "Rp 0";
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function annuityPayment(principal, annualRatePercent, months) {
  const r = annualRatePercent / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ---------------- Jadwal angsuran per bulan (efektif/anuitas) ----------------
function buildAmortizationSchedule(principal, annualRatePercent, months) {
  const schedule = [];
  if (months <= 0) return schedule;
  const r = annualRatePercent / 100 / 12;
  const M = annuityPayment(principal, annualRatePercent, months);
  let sisa = principal;
  for (let m = 1; m <= months; m++) {
    const bunga = sisa * r;
    const pokok = M - bunga;
    sisa = Math.max(sisa - pokok, 0);
    schedule.push({ month: m, cicilan: M, pokok, bunga, sisa });
  }
  return schedule;
}

// ---------------- Palette ----------------
const NAVY = "#1E3A5F";
const BLUE_BG = "#EAF4FC";
const YELLOW = "#FDE68A";
const YELLOW_TEXT = "#7A5B00";

// ---------------- Tujuan dana ----------------
const TUJUAN_OPTIONS = [
  { key: "pendidikan", label: "Biaya pendidikan", desc: "Uang pangkal sekolah/kuliah anak, biaya kursus, atau melanjutkan studi sendiri", icon: GraduationCap },
  { key: "pernikahan", label: "Biaya pernikahan", desc: "Resepsi, mahar, dan persiapan acara", icon: HeartHandshake },
  { key: "renovasi", label: "Renovasi rumah", desc: "Perbaikan/renovasi ringan yang tidak butuh jaminan properti seperti Kredit Multiguna", icon: Hammer },
  { key: "kesehatan", label: "Biaya kesehatan/pengobatan", desc: "Tindakan medis, rawat inap, atau kebutuhan darurat kesehatan keluarga", icon: Stethoscope },
  { key: "konsolidasi_utang", label: "Pelunasan atau konsolidasi utang", desc: "Menggabungkan beberapa cicilan/kartu kredit jadi satu cicilan yang lebih ringan", icon: Landmark },
  { key: "modal_usaha", label: "Modal usaha kecil/sampingan", desc: "Tambahan modal kerja untuk usaha yang baru dirintis", icon: Store },
  { key: "lainnya", label: "Lainnya", desc: "Kebutuhan konsumtif lain di luar daftar di atas", icon: MoreHorizontal },
];

// ---------------- Produk: KSM (satu-satunya produk) ----------------
const KSM = {
  nama: "KSM", namaLengkap: "Kredit Serbaguna", icon: Wallet, warna: "#3E80B0",
  ringkasan: "Fasilitas kredit tanpa agunan yang diberikan kepada pegawai berpenghasilan tetap untuk membiayai berbagai macam kebutuhan konsumtif mereka.",
  bungaDefault: 8.25, tenorMax: 5, biayaAdmin: 350000, provisiPercent: 1.5,
  syarat: [
    "Warga Negara Indonesia (WNI) & berdomisili di Indonesia",
    "Usia minimal 21 tahun atau sudah menikah, maksimal 55 tahun atau sesuai usia pensiun saat kredit lunas",
    "Masa kerja minimum pegawai tetap 1 tahun",
    "Diprioritaskan untuk instansi PNS/TNI/POLRI, BUMN, BUMD, dan Swasta yang memiliki kerja sama resmi atau payroll di Bank Mandiri",
    "Dikenakan Biaya Provisi, Biaya Administrasi, dan Premi Asuransi Jiwa",
  ],
  caraPengajuan: [
    { icon: Building2, text: "Diajukan langsung dengan mengunjungi KCP Bank Mandiri Graha Mitra" },
    { icon: PhoneCall, text: "Menghubungi langsung nomor kontak PIC KCP Bank Mandiri Graha Mitra yang tertera di halaman ini" },
    { icon: Smartphone, text: "Pengajuan via aplikasi Livin' by Mandiri (khusus nasabah terpilih) wajib dikonfirmasikan ke PIC Cabang Graha Mitra" },
    { icon: PhoneCall, text: "Hubungi Mandiri Call 14000 dan minta nomor kontak atau sambungan langsung ke PIC KSM KCP Bank Mandiri Graha Mitra" },
  ],
  keunggulan: [
    "Tanpa jaminan tambahan, proses lebih simpel dan cepat",
    "Dana bebas dipakai untuk berbagai kebutuhan konsumtif",
    "Cukup dengan slip gaji, tanpa perlu sertifikat aset",
    "Cicilan tetap sama tiap bulan sampai lunas, jadi lebih mudah diatur",
  ],
  pic: { nama: "Antasari Sihombing", jabatan: "Sales Generalist Konsumtif", whatsapp: "6283897883156", email: "antasari.s@bankmandiri.co.id" },
};

function computeResult(dana, tenorDiinginkan, income, usia, bungaRate) {
  const principal = dana;
  const ageCap = usia ? Math.max(1, 55 - usia + 1) : KSM.tenorMax;
  const effectiveTenorMax = Math.min(KSM.tenorMax, Math.max(ageCap, 1));
  const tenorYears = Math.min(tenorDiinginkan, effectiveTenorMax);
  const months = tenorYears * 12;
  const cicilan = annuityPayment(principal, bungaRate, months);
  const biayaAwal = KSM.biayaAdmin + principal * (KSM.provisiPercent / 100);
  const totalBayar = cicilan * months + biayaAwal;
  const dbr = income > 0 ? (cicilan / income) * 100 : 0;
  const tenorDipangkas = tenorYears < tenorDiinginkan;
  const schedule = buildAmortizationSchedule(principal, bungaRate, months);
  return { principal, tenorYears, months, cicilan, biayaAwal, totalBayar, dbr, tenorDipangkas, effectiveTenorMax, schedule };
}

// ---------------- Small UI atoms ----------------
function Card({ children, style }) {
  return <div style={{ background: "#fff", border: "1px solid #DCEAF7", borderRadius: 18, boxShadow: "0 2px 12px rgba(30,58,95,0.06)", ...style }}>{children}</div>;
}
const inputStyle = {
  padding: "11px 13px", borderRadius: 11, border: "1.5px solid #DCEAF7", fontSize: 14,
  fontFamily: "inherit", outline: "none", color: "#111827", width: "100%", background: "#fff",
};
function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1E3A5F" }}>{label}</span>
      {children}
    </label>
  );
}
function PrimaryBtn({ children, onClick, disabled, icon: Icon }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "13px 26px", borderRadius: 13, border: "none", fontSize: 14.5, fontWeight: 700,
      background: disabled ? "#C9D6E3" : `linear-gradient(135deg, ${NAVY}, #3E80B0)`,
      color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: disabled ? "none" : "0 4px 14px rgba(30,58,95,0.28)",
    }}>
      {children} {Icon && <Icon size={16} />}
    </button>
  );
}
function GhostBtn({ children, onClick, icon: Icon }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 7, padding: "13px 18px", borderRadius: 13,
      border: "1.5px solid #DCEAF7", background: "#fff", color: NAVY, fontSize: 14, fontWeight: 600, cursor: "pointer",
    }}>
      {Icon && <Icon size={16} />} {children}
    </button>
  );
}
function Pill({ selected, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 15px", borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: "pointer",
      border: selected ? `1.5px solid ${NAVY}` : "1.5px solid #DCEAF7",
      background: selected ? BLUE_BG : "#fff", color: selected ? NAVY : "#6B7A8D",
    }}>
      {children}
    </button>
  );
}
function CheckboxCard({ selected, onClick, icon: Icon, title, desc }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 13, cursor: "pointer",
      border: selected ? `1.5px solid ${NAVY}` : "1.5px solid #DCEAF7", background: selected ? BLUE_BG : "#fff",
    }}>
      <div style={{
        width: 19, height: 19, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: selected ? NAVY : "#fff", border: selected ? "none" : "1.5px solid #C9D6E3",
      }}>
        {selected && <Check size={13} color="#fff" />}
      </div>
      {Icon && <Icon size={16} color={selected ? NAVY : "#8B95A1"} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#8B95A1", lineHeight: 1.45 }}>{desc}</p>}
      </div>
    </div>
  );
}
function InfoRow({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", gap: 9, marginBottom: 8 }}>
      <Icon size={14} color="#3E80B0" style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

// ---------------- Step indicator ----------------
const STEPS = ["Profil", "Tujuan", "Produk", "Dana & Bunga", "Hasil"];
function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? NAVY : active ? YELLOW : "#fff",
                border: active ? `2px solid ${NAVY}` : done ? "none" : "1.5px solid #DCEAF7",
                color: done ? "#fff" : active ? YELLOW_TEXT : "#9CB0C4", fontWeight: 700, fontSize: 11.5,
              }}>
                {done ? <Check size={13} /> : idx}
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: active || done ? NAVY : "#9CB0C4", textAlign: "center", maxWidth: 60 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: idx < current ? NAVY : "#DCEAF7", margin: "0 4px 16px" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
function MiniStat({ label, value }) {
  return (
    <div style={{ background: BLUE_BG, borderRadius: 11, padding: "10px 12px" }}>
      <p style={{ margin: "0 0 3px", fontSize: 10.5, color: "#5B7893", fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{value}</p>
    </div>
  );
}
function ContactCard({ pic, productName }) {
  const initial = pic.nama.trim().charAt(0).toUpperCase();
  const waText = encodeURIComponent(`Halo ${pic.nama}, saya ingin tanya-tanya soal ${productName}.`);
  const waLink = `https://wa.me/${pic.whatsapp}?text=${waText}`;
  const waDisplay = "+" + pic.whatsapp.replace(/(\d{2})(\d{3})(\d{4})(\d+)/, "$1 $2-$3-$4");

  return (
    <Card style={{ padding: 18, width: 240, flexShrink: 0, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: NAVY, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, flexShrink: 0,
        }}>
          {initial}
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 13.5, fontWeight: 700, color: "#111827", lineHeight: 1.25 }}>{pic.nama}</p>
          <p style={{ margin: 0, fontSize: 10.5, color: "#9CA3AF", lineHeight: 1.35 }}>{pic.jabatan}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <MessageCircle size={14} color="#25D366" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "#374151" }}>{waDisplay}</span>
        </a>
        <a href={`mailto:${pic.email}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Mail size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "#374151", wordBreak: "break-all" }}>{pic.email}</span>
        </a>
      </div>

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          padding: "11px 12px", borderRadius: 12, background: "#F59E0B", color: "#fff",
          fontSize: 12.5, fontWeight: 700, textDecoration: "none",
        }}
      >
        <MessageCircle size={14} /> Hubungi Sekarang
      </a>
    </Card>
  );
}

function dbrBadge(dbr, dbrHijau) {
  if (dbr <= dbrHijau) return { bg: "#DCFCE7", color: "#15803D", text: "Sangat sesuai kemampuanmu" };
  if (dbr <= 40) return { bg: YELLOW, color: YELLOW_TEXT, text: "Masih aman, tapi cukup mepet" };
  return { bg: "#FEE2E2", color: "#B91C1C", text: "Cukup berat untuk penghasilanmu" };
}

// ================= MAIN APP =================
export default function KalkulatorSimulasiKredit() {
  const [step, setStep] = useState(1);

  // Step 1 — profil
  const [nama, setNama] = useState("");
  const [usia, setUsia] = useState(30);
  const [statusKaryawan, setStatusKaryawan] = useState("Karyawan Tetap");
  const [namaPerusahaan, setNamaPerusahaan] = useState("");
  const [status, setStatus] = useState("Belum Menikah");
  const [penghasilan, setPenghasilan] = useState(15000000);
  const [tanggungan, setTanggungan] = useState(0);

  // Step 2 — tujuan
  const [tujuanKeys, setTujuanKeys] = useState([]);

  // Step 4 — dana, tenor, bunga
  const [dana, setDana] = useState(50000000);
  const [tenor, setTenor] = useState(3);
  const [bungaRate, setBungaRate] = useState(KSM.bungaDefault);

  // Modal proyeksi angsuran per bulan
  const [showDetail, setShowDetail] = useState(false);
  const [detailView, setDetailView] = useState("grafik");

  function toggleTujuan(key) {
    setTujuanKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  const result = useMemo(() => computeResult(dana, tenor, penghasilan, usia, bungaRate), [dana, tenor, penghasilan, usia, bungaRate]);

  const dbrHijau = tanggungan >= 3 ? 25 : 30;
  const badge = dbrBadge(result.dbr, dbrHijau);

  const canNext1 = nama.trim() && usia > 0 && penghasilan > 0 && namaPerusahaan.trim();
  const canNext2 = tujuanKeys.length > 0;
  const canNext4 = dana > 0 && tenor > 0 && bungaRate > 0;

  const tenorOptions = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: `linear-gradient(160deg, ${BLUE_BG} 0%, #FFFBEA 100%)`, minHeight: "100%", padding: "26px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #1E3A5F !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${NAVY}, #3E80B0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: NAVY, margin: 0 }}>Kalkulator Simulasi KSM</h1>
            <p style={{ margin: 0, fontSize: 12.5, color: "#6B7A8D" }}>Simulasi Kredit Serbaguna (KSM) Bank Mandiri, dalam 5 langkah gampang</p>
          </div>
        </div>

        <StepIndicator current={step} />

        {/* ============ STEP 1: PROFIL ============ */}
        {step === 1 && (
          <Card style={{ padding: 26 }}>
            <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Yuk, kenalan dulu 👋</p>
            <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "#8B95A1" }}>Data ini bantu kami hitung simulasi KSM yang paling akurat buat kamu.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 18 }}>
              <Field label="Nama">
                <input style={inputStyle} placeholder="Nama kamu" value={nama} onChange={(e) => setNama(e.target.value)} />
              </Field>
              <Field label="Usia">
                <input type="number" style={inputStyle} value={usia} onChange={(e) => setUsia(parseFloat(e.target.value) || 0)} />
              </Field>
              <Field label="Nama perusahaan">
                <input style={inputStyle} placeholder="Tempat kamu bekerja" value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} />
              </Field>
              <Field label="Penghasilan bersih/bulan">
                <input type="number" style={inputStyle} value={penghasilan} onChange={(e) => setPenghasilan(parseFloat(e.target.value) || 0)} />
              </Field>
              <Field label="Jumlah tanggungan">
                <input type="number" style={inputStyle} value={tanggungan} onChange={(e) => setTanggungan(parseFloat(e.target.value) || 0)} />
              </Field>
            </div>

            <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 600, color: "#1E3A5F" }}>Status karyawan</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {["Karyawan Tetap", "PPPK"].map((p) => (
                <Pill key={p} selected={statusKaryawan === p} onClick={() => setStatusKaryawan(p)}>{p}</Pill>
              ))}
            </div>

            <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 600, color: "#1E3A5F", display: "flex", alignItems: "center", gap: 6 }}>
              <Heart size={13} /> Status
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Belum Menikah", "Menikah"].map((s) => (
                <Pill key={s} selected={status === s} onClick={() => setStatus(s)}>{s}</Pill>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <PrimaryBtn onClick={() => setStep(2)} disabled={!canNext1} icon={ArrowRight}>Lanjut</PrimaryBtn>
            </div>
          </Card>
        )}

        {/* ============ STEP 2: TUJUAN ============ */}
        {step === 2 && (
          <Card style={{ padding: 26 }}>
            <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Dana ini buat apa? 🎯</p>
            <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "#8B95A1" }}>Boleh pilih lebih dari satu.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TUJUAN_OPTIONS.map((t) => (
                <CheckboxCard key={t.key} selected={tujuanKeys.includes(t.key)} onClick={() => toggleTujuan(t.key)} icon={t.icon} title={t.label} desc={t.desc} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
              <GhostBtn onClick={() => setStep(1)} icon={ArrowLeft}>Kembali</GhostBtn>
              <PrimaryBtn onClick={() => setStep(3)} disabled={!canNext2} icon={ArrowRight}>Lanjut</PrimaryBtn>
            </div>
          </Card>
        )}

        {/* ============ STEP 3: PRODUK (detail KSM) ============ */}
        {step === 3 && (
          <Card style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${KSM.warna}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={19} color={KSM.warna} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{KSM.nama} — {KSM.namaLengkap}</p>
              </div>
            </div>
            <p style={{ margin: "10px 0 20px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{KSM.ringkasan}</p>

            <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 700, color: NAVY, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={15} /> Syarat &amp; Biaya
            </p>
            <div style={{ marginBottom: 8 }}>
              {KSM.syarat.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <Check size={13} color="#15803D" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.55 }}>{s}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: "18px 0 10px", fontSize: 13.5, fontWeight: 700, color: NAVY }}>Cara Pengajuan</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 6 }}>
              {KSM.caraPengajuan.map((c, i) => (
                <InfoRow key={i} icon={c.icon}>{c.text}</InfoRow>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
              <GhostBtn onClick={() => setStep(2)} icon={ArrowLeft}>Kembali</GhostBtn>
              <PrimaryBtn onClick={() => setStep(4)} icon={ArrowRight}>Lanjut</PrimaryBtn>
            </div>
          </Card>
        )}

        {/* ============ STEP 4: DANA & BUNGA ============ */}
        {step === 4 && (
          <Card style={{ padding: 26 }}>
            <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Berapa dana yang kamu butuhkan? 💰</p>
            <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "#8B95A1" }}>Perkiraan saja tidak apa-apa, nanti masih bisa disesuaikan lagi.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, alignItems: "start" }}>
              <Field label="Estimasi dana pinjaman">
                <input type="number" style={inputStyle} value={dana} onChange={(e) => setDana(parseFloat(e.target.value) || 0)} />
              </Field>
              <Field label="Tenor yang diinginkan">
                <select style={inputStyle} value={tenor} onChange={(e) => setTenor(parseFloat(e.target.value))}>
                  {tenorOptions.map((t) => <option key={t} value={t}>{t} tahun</option>)}
                </select>
                {statusKaryawan === "PPPK" && (
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: "#B45309", lineHeight: 1.55, display: "flex", gap: 6, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "9px 11px" }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    Khusus status karyawan <strong>PPPK</strong>, tenor yang dipilih wajib mengikuti sisa masa kontrak kerja dan tidak boleh melebihi jangka waktu kontrak yang berlaku.
                  </p>
                )}
              </Field>
            </div>

            <p style={{ margin: "18px 0 8px", fontSize: 12.5, fontWeight: 600, color: "#1E3A5F" }}>Metode bunga</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <Pill selected>Efektif (Anuitas)</Pill>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "#6B7A8D", lineHeight: 1.5, display: "flex", gap: 6 }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Bunga dihitung dari sisa pokok pinjaman, cicilan tetap sama tiap bulan sampai lunas.
            </p>

            <div style={{ maxWidth: 260 }}>
              <Field label="Suku bunga (%/tahun)">
                <input type="number" step="0.01" style={inputStyle} value={bungaRate} onChange={(e) => setBungaRate(parseFloat(e.target.value) || 0)} />
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
              <GhostBtn onClick={() => setStep(3)} icon={ArrowLeft}>Kembali</GhostBtn>
              <PrimaryBtn onClick={() => setStep(5)} disabled={!canNext4} icon={ArrowRight}>Lihat Hasil</PrimaryBtn>
            </div>
          </Card>
        )}

        {/* ============ STEP 5: HASIL ============ */}
        {step === 5 && (
          <div>
            <Card style={{ padding: "20px 26px", marginBottom: 16, background: `linear-gradient(135deg, ${NAVY}, #3E80B0)`, border: "none" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <PartyPopper size={22} color="#fff" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#CFE3F5", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Hasil simulasi buat kamu</p>
                  <p style={{ margin: 0, fontSize: 15, color: "#fff", lineHeight: 1.6 }}>
                    Halo <strong>{nama}</strong>! Ini simulasi KSM untuk kebutuhan dana {rupiah(dana)} di Bank Mandiri, dengan bunga efektif {bungaRate}%/tahun.
                  </p>
                </div>
              </div>
            </Card>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
              <Card style={{ padding: 20, borderTop: `4px solid ${KSM.warna}`, flex: "1 1 300px", minWidth: 280 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${KSM.warna}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Wallet size={16} color={KSM.warna} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#111827" }}>{KSM.nama}</p>
                      <p style={{ margin: 0, fontSize: 10.5, color: "#9CA3AF" }}>{KSM.namaLengkap}</p>
                    </div>
                  </div>
                </div>

                <p style={{ margin: "0 0 2px", fontSize: 10.5, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>Cicilan per bulan</p>
                <p style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: KSM.warna }}>{rupiah(result.cicilan)}</p>

                <span style={{ display: "inline-block", marginBottom: 12, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
                  {badge.text}
                </span>

                {result.tenorDipangkas && (
                  <p style={{ margin: "0 0 12px", fontSize: 11, color: "#B45309" }}>
                    Tenor otomatis disesuaikan jadi {result.tenorYears} tahun mengikuti batas usia/tenor maksimal KSM.
                  </p>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <MiniStat label="Tenor" value={`${result.tenorYears} thn`} />
                  <MiniStat label="Total s/d lunas" value={rupiah(result.totalBayar)} />
                  <MiniStat label="Biaya awal" value={rupiah(result.biayaAwal)} />
                  <MiniStat label="Suku bunga" value={`${bungaRate}%/thn`} />
                </div>

                <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 700, color: "#15803D", display: "flex", alignItems: "center", gap: 5 }}>
                  <ThumbsUp size={12} /> Keunggulan
                </p>
                {KSM.keunggulan.slice(0, 3).map((k, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <Check size={12} color="#15803D" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.4 }}>{k}</span>
                  </div>
                ))}

                <button
                  onClick={() => { setShowDetail(true); setDetailView("grafik"); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    width: "100%", marginTop: 14, padding: "9px 12px", borderRadius: 10,
                    border: `1.5px solid ${KSM.warna}`, background: `${KSM.warna}0D`, color: KSM.warna,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <BarChart3 size={13} /> Lihat Proyeksi Angsuran per Bulan
                </button>
              </Card>

              <ContactCard pic={KSM.pic} productName={KSM.nama} />
            </div>

            <Card style={{ padding: "20px 24px", marginBottom: 16, background: `linear-gradient(135deg, #FFFBEA, #FEF3C7)`, border: `1px solid ${YELLOW}` }}>
              <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: YELLOW_TEXT, display: "flex", alignItems: "center", gap: 7 }}>
                <Rocket size={16} /> Kenapa KSM jadi pilihan tepat buat kamu?
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#5B4A00", lineHeight: 1.65 }}>
                Dengan cicilan mulai <strong>{rupiah(result.cicilan)}/bulan</strong> dan proses tanpa jaminan tambahan, kamu bisa segera wujudkan rencanamu tanpa perlu menunggu lama.
                Cukup modal slip gaji dan dokumen kerja — nggak perlu sertifikat rumah atau BPKB. Yuk, jangan tunda kebutuhanmu, ajukan KSM sekarang sebelum makin mepet waktunya!
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5B4A00", fontWeight: 600 }}><Zap size={13} /> Proses cepat</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5B4A00", fontWeight: 600 }}><ShieldCheck size={13} /> Tanpa jaminan tambahan</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5B4A00", fontWeight: 600 }}><Clock size={13} /> Cicilan tetap, mudah diatur</span>
              </div>
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <GhostBtn onClick={() => setStep(4)} icon={ArrowLeft}>Ubah Dana &amp; Bunga</GhostBtn>
            </div>

            <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: "18px 0 0" }}>
              *Simulasi ini bersifat ilustratif, bukan penawaran resmi. Angka final mengikuti ketentuan bank saat pengajuan.
            </p>
          </div>
        )}
      </div>

      {showDetail && (
        <ScheduleDetailModal
          product={KSM}
          result={result}
          bungaRate={bungaRate}
          view={detailView}
          setView={setDetailView}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}

// ---------------- Modal: Proyeksi angsuran per bulan ----------------
function ScheduleDetailModal({ product, result, bungaRate, view, setView, onClose }) {
  const schedule = result.schedule;
  const totalBunga = schedule.reduce((acc, s) => acc + s.bunga, 0);
  const totalPokok = schedule.reduce((acc, s) => acc + s.pokok, 0);

  const thStyle = {
    position: "sticky", top: 0, background: BLUE_BG, color: "#1E3A5F", fontSize: 10.5, fontWeight: 700,
    textTransform: "uppercase", padding: "9px 10px", textAlign: "right", borderBottom: "1.5px solid #DCEAF7",
  };
  const tdStyle = { padding: "7px 10px", textAlign: "right", fontSize: 11.5, color: "#374151", whiteSpace: "nowrap" };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "88vh",
          display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(17,24,39,0.35)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #F1F3F5", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 15.5, fontWeight: 800, color: "#111827" }}>Proyeksi Angsuran — {product.nama}</p>
            <p style={{ margin: 0, fontSize: 11.5, color: "#8B95A1" }}>
              Bunga efektif (anuitas) {bungaRate}%/tahun · Tenor {result.tenorYears} tahun ({schedule.length} bulan)
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#F1F3F5", border: "none", borderRadius: 999, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={15} color="#6B7A8D" />
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "14px 22px 0" }}>
          <MiniStat label="Total pokok" value={rupiah(totalPokok)} />
          <MiniStat label="Total bunga" value={rupiah(totalBunga)} />
          <MiniStat label="Cicilan/bulan" value={rupiah(schedule[0]?.cicilan || 0)} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, padding: "14px 22px 0" }}>
          <button onClick={() => setView("grafik")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            border: view === "grafik" ? `1.5px solid ${NAVY}` : "1.5px solid #DCEAF7",
            background: view === "grafik" ? BLUE_BG : "#fff", color: view === "grafik" ? NAVY : "#6B7A8D",
            fontSize: 12.5, fontWeight: 700,
          }}>
            <LineChartIcon size={13} /> Grafik
          </button>
          <button onClick={() => setView("tabel")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            border: view === "tabel" ? `1.5px solid ${NAVY}` : "1.5px solid #DCEAF7",
            background: view === "tabel" ? BLUE_BG : "#fff", color: view === "tabel" ? NAVY : "#6B7A8D",
            fontSize: 12.5, fontWeight: 700,
          }}>
            <TableProperties size={13} /> Tabel
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 22px 22px", overflowY: "auto", flex: 1 }}>
          {view === "grafik" ? (
            <div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={schedule} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAF4FC" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#6B7A8D" }}
                    label={{ value: "Bulan ke-", position: "insideBottom", offset: -3, fontSize: 11, fill: "#6B7A8D" }}
                  />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${Math.round(v / 1e6)}jt`} tick={{ fontSize: 10, fill: "#6B7A8D" }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${Math.round(v / 1e6)}jt`} tick={{ fontSize: 10, fill: "#6B7A8D" }} />
                  <Tooltip
                    formatter={(v, name) => [rupiah(v), name]}
                    labelFormatter={(l) => `Bulan ke-${l}`}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #DCEAF7" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11.5 }} />
                  <Bar yAxisId="left" dataKey="pokok" stackId="a" name="Pokok" fill={product.warna} radius={[0, 0, 0, 0]} />
                  <Bar yAxisId="left" dataKey="bunga" stackId="a" name="Bunga" fill="#FDBA74" radius={[0, 0, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="sisa" name="Sisa Pinjaman" stroke={NAVY} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
                Batang: komposisi pokok &amp; bunga per bulan (sumbu kiri) · Garis: sisa pinjaman (sumbu kanan)
              </p>
            </div>
          ) : (
            <div style={{ border: "1px solid #DCEAF7", borderRadius: 12, maxHeight: 380, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: "left" }}>Bulan</th>
                    <th style={thStyle}>Angsuran</th>
                    <th style={thStyle}>Pokok</th>
                    <th style={thStyle}>Bunga</th>
                    <th style={thStyle}>Sisa Pinjaman</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.month} style={{ background: row.month % 12 === 0 ? "#FFFBEA" : "#fff", borderBottom: "1px solid #F1F3F5" }}>
                      <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600, color: "#111827" }}>
                        {row.month}{row.month % 12 === 0 ? ` (thn ${row.month / 12})` : ""}
                      </td>
                      <td style={tdStyle}>{rupiah(row.cicilan)}</td>
                      <td style={tdStyle}>{rupiah(row.pokok)}</td>
                      <td style={tdStyle}>{rupiah(row.bunga)}</td>
                      <td style={tdStyle}>{rupiah(row.sisa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
