import React, { useState } from "react";
import {
  Search, ShieldCheck, AlertTriangle, CheckCircle2,
  FileText, Sparkles, Trophy, RefreshCw, Eye, HelpCircle,
  ChevronRight, ArrowRight
} from "lucide-react";

const CASES_DATA = [
  {
    id: "contract_installment",
    category: "Tín dụng tiêu dùng • Hợp đồng vay",
    title: "Hợp Đồng Mua Xe Máy Trả Góp",
    subtitle: "Công ty Tài chính Cổ phần SpeedyPay & Khách hàng Sinh viên",
    overview: "Bạn dự định mua một chiếc xe máy số giá 22.000.000 đ. Bạn trả trước 7 triệu (khoảng 30%), số còn lại 15.000.000 đ làm thủ tục vay trả góp 12 tháng qua công ty tài chính. Hãy soi bản hợp đồng dưới đây để vạch trần 3 cạm bẫy chi phí ẩn!",
    totalTraps: 3,
    traps: [
      {
        id: "trap_insurance",
        name: "Phí bảo hiểm khoản vay bắt buộc",
        severity: "Cao",
        clauseText: "Điều 3.2: Khách hàng tự nguyện đăng ký Phí Bảo hiểm Dư nợ Tín dụng bắt buộc trị giá 1.800.000 VNĐ. Khoản phí này được cộng gộp trực tiếp vào Tổng dư nợ gốc ban đầu (nâng số tiền vay lên 16.800.000 VNĐ).",
        whyTrap: "BẪY GỘP PHÍ VÀO GỐC! Khi phí bảo hiểm 1.8 triệu bị cộng vào gốc, bạn vừa mất tiền mua bảo hiểm vừa phải trả tiền LÃI SUẤT trên chính khoản 1.8 triệu này suốt 12 tháng! Luật cho phép bảo hiểm tín dụng là tự nguyện, nhưng nhân viên tư vấn thường ép mua dưới dạng điều kiện bắt buộc.",
      },
      {
        id: "trap_flat_interest",
        name: "Lãi suất phẳng trên dư nợ gốc ban đầu",
        severity: "Rất nguy hiểm",
        clauseText: "Điều 4.1: Mức lãi suất cho vay ưu đãi là 2.3%/tháng (tương đương 27.6%/năm), được áp dụng cố định theo phương pháp Dư nợ gốc ban đầu trên toàn bộ kỳ hạn 12 tháng.",
        whyTrap: "BẪY LÃI SUẤT PHẲNG! Lãi suất tính theo 'Dư nợ gốc ban đầu' nghĩa là dù bạn đã trả được 11 tháng và chỉ còn nợ 1 triệu, bạn vẫn phải trả tiền lãi của cả 16.8 triệu ban đầu! Lãi suất thực tế theo phương pháp dư nợ giảm dần tương đương lên tới gần 50%/năm.",
      },
      {
        id: "trap_penalty",
        name: "Phí phạt tất toán sớm & Lãi phạt trễ hạn",
        severity: "Nghiêm trọng",
        clauseText: "Điều 7.4: Trường hợp chậm thanh toán từ 01 ngày, lãi suất phạt quá hạn bằng 150% lãi suất thông thường cộng phí quản lý trễ hạn 350.000 VNĐ/lần. Nếu khách hàng muốn tất toán toàn bộ trước hạn, mức phí bồi thường vi phạm hợp đồng là 5% trên dư nợ còn lại.",
        whyTrap: "BẪY PHÍ PHẠT CẮT CỔ! Nhiều sinh viên nghĩ 'chậm 1-2 hôm trả tiền cũng không sao'. Nhưng phí cố định 350k + lãi phạt 150% sẽ khiến khoản trả tháng đó tăng vọt. Ngoài ra, việc muốn trả hết nợ sớm cũng bị phạt tới 5% dư nợ còn lại.",
      },
    ],
  },
  {
    id: "statement_credit_card",
    category: "Thẻ tín dụng ngân hàng • Sao kê",
    title: "Bảng Sao Kê Thẻ Tín Dụng Sinh Viên",
    subtitle: "Ngân Hàng StudentBank Visa - Bảng tổng kết giao dịch tháng 11",
    overview: "Sau một tháng chi tiêu bằng thẻ tín dụng (mua laptop, mua sách, ăn uống và 1 lần rút ATM), bạn nhận được bảng sao kê 8.200.000 đ. Hãy soi kỹ sao kê để tìm ra 3 điểm mấu chốt quyết định bạn có phải trả lãi hay không!",
    totalTraps: 3,
    traps: [
      {
        id: "trap_min_payment",
        name: "Bẫy 'Thanh toán tối thiểu' (Minimum Payment)",
        severity: "Cực kỳ nguy hiểm",
        clauseText: "Mục B: Số tiền thanh toán tối thiểu: 410.000 VNĐ (5% dư nợ). Quý khách chỉ cần thanh toán tối thiểu trước 17h00 ngày 25/11/2026 để duy trì thẻ không bị khóa nợ xấu.",
        whyTrap: "BẪY ĐẮT GIÁ NHẤT CỦA THẺ TÍN DỤNG! Nếu bạn chỉ đóng 410.000 đ, bạn nghĩ rằng mình chỉ còn nợ phần còn lại? Hoàn toàn SAI! Ngân hàng sẽ bãi bỏ toàn bộ quyền lợi miễn lãi và áp dụng mức lãi suất 33%/năm lên TOÀN BỘ 8.200.000 đ tính ngược từ ngày bạn quẹt thẻ, khiến tiền lãi phình to chóng mặt!",
      },
      {
        id: "trap_atm_cash",
        name: "Phí rút tiền mặt tại cây ATM",
        severity: "Sai lầm phổ biến",
        clauseText: "Dòng giao dịch ngày 05/11: Rút tiền mặt tại ATM VCB: 2.000.000 VNĐ | Phí rút tiền mặt (4%): 80.000 VNĐ | Lãi suất tính ngay từ ngày rút: 0.09%/ngày.",
        whyTrap: "SAI LẦM NGUY TỬ KHI DÙNG THẺ TÍN DỤNG! Thẻ tín dụng sinh ra để thanh toán mua sắm hàng hóa (0% lãi suất). Nếu dùng thẻ để rút tiền mặt tại ATM, bạn bị trừ ngay 4% phí giao dịch (80.000 đ) VÀ bị tính lãi suất cao ngay lập tức trong ngày rút mà KHÔNG CÓ thời gian 45 ngày miễn lãi!",
      },
      {
        id: "trap_due_date_rule",
        name: "Nguyên tắc vàng: Miễn lãi 45 ngày",
        severity: "Bí quyết quản trị",
        clauseText: "Mục C: Ngày đến hạn thanh toán: 25/11/2026. Để được áp dụng mức LÃI SUẤT 0% (Ưu đãi miễn lãi 45 ngày), Quý khách cần thanh toán TOÀN BỘ 100% Tổng Dư Nợ 8.200.000 VNĐ trước ngày này.",
        whyTrap: "QUY TẮC SỐNG CÒN CỦA THẺ TÍN DỤNG: Chỉ có MỘT CÁCH DUY NHẤT để không mất tiền oan cho ngân hàng: Luôn luôn thanh toán 100% dư nợ đúng hạn trước ngày quyết toán. Tận dụng vốn miễn phí 45 ngày của ngân hàng để sinh lời, chứ không bao giờ để nợ kéo sang kỳ sau.",
      },
    ],
  },
];

export default function DetectiveGame({ onAsk, T }) {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [discoveredTraps, setDiscoveredTraps] = useState({}); // { [trapId]: true }
  const [activeTrapPopup, setActiveTrapPopup] = useState(null);
  const [detectiveScore, setDetectiveScore] = useState(0);
  const [missClickMsg, setMissClickMsg] = useState(null);

  const activeCase = CASES_DATA[activeCaseIndex];
  const currentDiscovered = Object.keys(discoveredTraps).filter((id) =>
    activeCase.traps.some((t) => t.id === id)
  );
  const isCaseCompleted = currentDiscovered.length === activeCase.totalTraps;

  const handleInspectTrap = (trap) => {
    if (!discoveredTraps[trap.id]) {
      setDiscoveredTraps((prev) => ({ ...prev, [trap.id]: true }));
      setDetectiveScore((prev) => prev + 35);
    }
    setActiveTrapPopup(trap);
    setMissClickMsg(null);
  };

  const handleMissClick = () => {
    setMissClickMsg("🔍 Đây là điều khoản thông thường, hãy đọc kỹ phần ghi chú in nhỏ (fine print), phí bổ sung hoặc lãi suất!");
    setTimeout(() => setMissClickMsg(null), 3000);
  };

  const handleSwitchCase = (idx) => {
    setActiveCaseIndex(idx);
    setActiveTrapPopup(null);
    setMissClickMsg(null);
  };

  const handleRestartCase = () => {
    setDiscoveredTraps({});
    setActiveTrapPopup(null);
    setDetectiveScore(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Thanh Điều Hướng Chọn Vụ Án Thám Tử */}
      <div
        style={{
          display: "flex",
          gap: 8,
          background: T.border,
          borderRadius: 12,
          padding: 3,
        }}
      >
        {CASES_DATA.map((c, idx) => {
          const active = idx === activeCaseIndex;
          const caseDiscovered = Object.keys(discoveredTraps).filter((id) =>
            c.traps.some((t) => t.id === id)
          ).length;
          return (
            <button
              key={c.id}
              onClick={() => handleSwitchCase(idx)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: active ? T.card : "transparent",
                color: active ? T.tealDark : T.inkSoft,
                fontWeight: active ? 700 : 500,
                fontSize: 11.5,
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <FileText size={14} color={active ? T.teal : T.inkSoft} />
              <span>{idx === 0 ? "Vụ án 1: Trả góp xe" : "Vụ án 2: Thẻ tín dụng"}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: caseDiscovered === c.totalTraps ? "#ECFDF5" : "#FEF3C7",
                  color: caseDiscovered === c.totalTraps ? "#059669" : "#B45309",
                }}
              >
                {caseDiscovered}/{c.totalTraps}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bảng Chỉ Số Thám Tử Gamified */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 18,
          padding: "12px 16px",
          boxShadow: "0 4px 14px -2px rgba(0, 0, 0, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "#FEF3C7",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Search size={19} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
              Nhiệm Vụ Thám Tử
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Đã vạch trần:{" "}
              <span style={{ color: isCaseCompleted ? "#059669" : "#D97706" }}>
                {currentDiscovered.length} / {activeCase.totalTraps} cạm bẫy
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #DBEAFE",
            borderRadius: 12,
            padding: "6px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: "#3B82F6", textTransform: "uppercase" }}>
            Điểm Thám Tử
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1D4ED8" }}>
            +{detectiveScore} XP
          </div>
        </div>
      </div>

      {/* Thông điệp hướng dẫn tương tác */}
      <div
        style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 11.5,
          color: "#1E40AF",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Eye size={15} style={{ flexShrink: 0 }} />
        <span>
          <strong>Cách chơi:</strong> Di chuột / bấm vào các <u>đoạn văn bản được gạch chân hoặc đóng khung</u> trong văn bản bên dưới để lật tẩy các điều khoản ẩn nguy hiểm!
        </span>
      </div>

      {/* Báo lỗi khi click sai vùng */}
      {missClickMsg && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 11.5,
            color: "#991B1B",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {missClickMsg}
        </div>
      )}

      {/* GIAO DIỆN TÀI LIỆU MÔ PHỎNG THỰC TẾ (HỢP ĐỒNG / SAO KÊ) */}
      <div
        style={{
          background: "#FFFFFF",
          border: "2px solid #E2E8F0",
          borderRadius: 16,
          boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        }}
      >
        {/* Header Tài liệu */}
        <div
          style={{
            background: activeCaseIndex === 0 ? "#1E293B" : "#0F172A",
            color: "#FFFFFF",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.8, color: "#93C5FD" }}>
            {activeCase.category}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, margin: "2px 0" }}>
            {activeCase.title}
          </div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            {activeCase.subtitle}
          </div>
        </div>

        {/* Nội dung Tài liệu có thể bấm (Interactive Document) */}
        <div style={{ padding: "18px 20px", fontSize: 12.5, lineHeight: 1.6, color: "#334155" }}>
          <p style={{ margin: "0 0 14px", fontStyle: "italic", color: "#64748B", background: "#F8FAFC", padding: "8px 12px", borderRadius: 8 }}>
            📌 <strong>Tình huống:</strong> {activeCase.overview}
          </p>

          {/* VỤ ÁN 1: HỢP ĐỒNG TRẢ GÓP XE MÁY */}
          {activeCaseIndex === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div onClick={handleMissClick} style={{ cursor: "pointer" }}>
                <strong>Điều 1: Thông tin xe & Bên vay:</strong> Xe máy Honda Wave Alpha 110cc. Giá niêm yết: 22.000.000 VNĐ. Khách hàng trả trước 7.000.000 VNĐ.
              </div>

              <div onClick={handleMissClick} style={{ cursor: "pointer" }}>
                <strong>Điều 2: Thời hạn hợp đồng:</strong> 12 tháng kể từ ngày ký và bàn giao xe.
              </div>

              {/* BẪY 1: PHÍ BẢO HIỂM */}
              <div
                onClick={() => handleInspectTrap(activeCase.traps[0])}
                style={{
                  background: discoveredTraps[activeCase.traps[0].id] ? "#FEF3C7" : "#FFFBEB",
                  border: discoveredTraps[activeCase.traps[0].id] ? "2px solid #D97706" : "1px dashed #F59E0B",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>
                    🔍 [Khoản 3.2: Bảo hiểm tín dụng] - Bấm để soi
                  </span>
                  {discoveredTraps[activeCase.traps[0].id] && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={12} /> ĐÃ VẠCH TRẦN
                    </span>
                  )}
                </div>
                <div style={{ color: "#78350F", fontWeight: 600 }}>
                  {activeCase.traps[0].clauseText}
                </div>
              </div>

              {/* BẪY 2: LÃI SUẤT PHẲNG TRÊN GỐC BAN ĐẦU */}
              <div
                onClick={() => handleInspectTrap(activeCase.traps[1])}
                style={{
                  background: discoveredTraps[activeCase.traps[1].id] ? "#FEE2E2" : "#FFF5F5",
                  border: discoveredTraps[activeCase.traps[1].id] ? "2px solid #DC2626" : "1px dashed #EF4444",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>
                    🔍 [Khoản 4.1: Cách tính lãi suất] - Bấm để soi
                  </span>
                  {discoveredTraps[activeCase.traps[1].id] && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={12} /> ĐÃ VẠCH TRẦN
                    </span>
                  )}
                </div>
                <div style={{ color: "#991B1B", fontWeight: 600 }}>
                  {activeCase.traps[1].clauseText}
                </div>
              </div>

              <div onClick={handleMissClick} style={{ cursor: "pointer" }}>
                <strong>Điều 5: Hình thức thanh toán:</strong> Chuyển khoản định kỳ vào ngày 10 hàng tháng qua số tài khoản định danh của SpeedyPay.
              </div>

              {/* BẪY 3: PHÍ PHẠT TRỄ HẠN VÀ TẤT TOÁN SỚM */}
              <div
                onClick={() => handleInspectTrap(activeCase.traps[2])}
                style={{
                  background: discoveredTraps[activeCase.traps[2].id] ? "#FEF3C7" : "#FFFBEB",
                  border: discoveredTraps[activeCase.traps[2].id] ? "2px solid #D97706" : "1px dashed #F59E0B",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>
                    🔍 [Khoản 7.4: Chế tài vi phạm & Tất toán] - Bấm để soi
                  </span>
                  {discoveredTraps[activeCase.traps[2].id] && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={12} /> ĐÃ VẠCH TRẦN
                    </span>
                  )}
                </div>
                <div style={{ color: "#78350F", fontWeight: 600 }}>
                  {activeCase.traps[2].clauseText}
                </div>
              </div>
            </div>
          ) : (
            /* VỤ ÁN 2: BẢNG SAO KÊ THẺ TÍN DỤNG */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#F1F5F9",
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>TỔNG DƯ NỢ KỲ SAO KÊ</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>8.200.000 VNĐ</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#64748B" }}>HẠN MỨC KHẢ DỤNG</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>1.800.000 / 10.000.000 đ</div>
                </div>
              </div>

              {/* BẪY 1: THANH TOÁN TỐI THIỂU */}
              <div
                onClick={() => handleInspectTrap(activeCase.traps[0])}
                style={{
                  background: discoveredTraps[activeCase.traps[0].id] ? "#FEE2E2" : "#FFF5F5",
                  border: discoveredTraps[activeCase.traps[0].id] ? "2px solid #DC2626" : "1px dashed #EF4444",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>
                    🔍 [Mục B: Số tiền tối thiểu 410.000 đ] - Bấm để soi
                  </span>
                  {discoveredTraps[activeCase.traps[0].id] && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={12} /> ĐÃ VẠCH TRẦN
                    </span>
                  )}
                </div>
                <div style={{ color: "#991B1B", fontWeight: 600 }}>
                  {activeCase.traps[0].clauseText}
                </div>
              </div>

              {/* BẪY 2: RÚT TIỀN MẶT TẠI ATM */}
              <div
                onClick={() => handleInspectTrap(activeCase.traps[1])}
                style={{
                  background: discoveredTraps[activeCase.traps[1].id] ? "#FEF3C7" : "#FFFBEB",
                  border: discoveredTraps[activeCase.traps[1].id] ? "2px solid #D97706" : "1px dashed #F59E0B",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>
                    🔍 [Lịch sử giao dịch: Rút tiền ATM] - Bấm để soi
                  </span>
                  {discoveredTraps[activeCase.traps[1].id] && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={12} /> ĐÃ VẠCH TRẦN
                    </span>
                  )}
                </div>
                <div style={{ color: "#78350F", fontWeight: 600 }}>
                  {activeCase.traps[1].clauseText}
                </div>
              </div>

              {/* BẪY 3: QUY TẮC MIỄN LÃI 45 NGÀY */}
              <div
                onClick={() => handleInspectTrap(activeCase.traps[2])}
                style={{
                  background: discoveredTraps[activeCase.traps[2].id] ? "#ECFDF5" : "#F0FDF4",
                  border: discoveredTraps[activeCase.traps[2].id] ? "2px solid #059669" : "1px dashed #10B981",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>
                    🔍 [Mục C: Hạn chót & Điều kiện miễn lãi 0%] - Bấm để soi
                  </span>
                  {discoveredTraps[activeCase.traps[2].id] && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={12} /> ĐÃ VẠCH TRẦN
                    </span>
                  )}
                </div>
                <div style={{ color: "#065F46", fontWeight: 600 }}>
                  {activeCase.traps[2].clauseText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* POPUP / MODAL GIẢI MÃ CẠM BẪY KHI CLICK VÀO VÙNG NGHI VẤN */}
        {activeTrapPopup && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(3px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "20px",
                maxWidth: 420,
                width: "100%",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                animation: "scaleIn 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    background: "#FEE2E2",
                    color: "#DC2626",
                    fontWeight: 700,
                    fontSize: 10.5,
                    padding: "2px 8px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Mức độ: {activeTrapPopup.severity}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>
                  +35 Điểm Thám Tử
                </span>
              </div>

              <h4 style={{ margin: "2px 0 10px", fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                🚨 {activeTrapPopup.name}
              </h4>

              <div
                style={{
                  background: "#F8FAFC",
                  borderLeft: "3px solid #DC2626",
                  padding: "8px 12px",
                  fontSize: 11.5,
                  color: "#475569",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                "{activeTrapPopup.clauseText}"
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  color: "#1E293B",
                  lineHeight: 1.55,
                  marginBottom: 16,
                }}
              >
                {activeTrapPopup.whyTrap}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setActiveTrapPopup(null)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#0F172A",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Đã hiểu & Tiếp tục soi
                </button>
                <button
                  onClick={() => {
                    setActiveTrapPopup(null);
                    onAsk && onAsk(`Tuấn ơi, giải thích giúp mình kỹ hơn về bẫy "${activeTrapPopup.name}" trong các hợp đồng tài chính sinh viên nhé?`);
                  }}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Sparkles size={14} color="#0D9488" /> Hỏi Tuấn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BANNER CHÚC MỪNG KHI PHÁ GIẢI TOÀN BỘ VỤ ÁN */}
      {isCaseCompleted && (
        <div
          style={{
            background: "linear-gradient(135deg, #065F46, #047857)",
            color: "#FFFFFF",
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 16px rgba(4, 120, 87, 0.2)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <Trophy size={18} color="#FDE047" />
              <span style={{ fontSize: 14, fontWeight: 800 }}>
                Tuyệt đỉnh Thám Tử Tài Chính!
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, opacity: 0.9 }}>
              Bạn đã lật tẩy toàn bộ 3/3 cạm bẫy nguy hiểm trong {activeCase.title}.
            </p>
          </div>

          <button
            onClick={() => handleSwitchCase(activeCaseIndex === 0 ? 1 : 0)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: "#FFFFFF",
              color: "#065F46",
              fontWeight: 700,
              fontSize: 11.5,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {activeCaseIndex === 0 ? "Soi Vụ Án 2 ➔" : "Soi Lại Vụ Án 1 ➔"}
          </button>
        </div>
      )}
    </div>
  );
}
