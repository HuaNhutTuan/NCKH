/**
 * Tiện ích định dạng số tiền với dấu chấm phân cách hàng nghìn (Vietnamese currency format)
 */

/**
 * Định dạng chuỗi hoặc số thành định dạng có dấu chấm phân cách mỗi 3 chữ số (VD: 1000000 -> "1.000.000")
 * @param {string|number} val 
 * @returns {string}
 */
export function formatThousands(val) {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val);
  const clean = str.replace(/\D/g, "");
  if (!clean) return "";
  // Xóa các số 0 vô nghĩa ở đầu (VD: "05000" -> "5000", nhưng "0" vẫn giữ là "0")
  const noLeadingZeroes = clean.replace(/^0+(?=\d)/, "");
  return noLeadingZeroes.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Chuyển chuỗi định dạng có dấu chấm về dạng số nguyên (VD: "1.000.000" -> 1000000)
 * @param {string|number} val 
 * @returns {number}
 */
export function parseThousands(val) {
  if (val === null || val === undefined || val === "") return 0;
  const clean = String(val).replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Xử lý sự kiện onChange trên input để tự động thêm dấu chấm mỗi 3 chữ số,
 * đồng thời giữ nguyên vị trí con trỏ chuột (cursor) một cách tự nhiên.
 * @param {React.ChangeEvent<HTMLInputElement>} e
 * @param {(formatted: string, numericVal: number) => void} onChange
 */
export function handleNumericChange(e, onChange) {
  const input = e.target;
  const rawValue = input.value;
  const selectionStart = input.selectionStart || 0;
  // Đếm số chữ số nằm trước vị trí con trỏ hiện tại
  const digitsBefore = rawValue.slice(0, selectionStart).replace(/\D/g, "").length;

  const formatted = formatThousands(rawValue);
  const numericVal = parseThousands(formatted);

  onChange(formatted, numericVal);

  // Khôi phục vị trí con trỏ tương ứng với số chữ số trước đó
  requestAnimationFrame(() => {
    if (!input || !input.isConnected) return;
    let newPos = formatted.length;
    if (digitsBefore === 0) {
      newPos = 0;
    } else {
      let count = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) count++;
        if (count >= digitsBefore) {
          newPos = i + 1;
          break;
        }
      }
    }
    try {
      input.setSelectionRange(newPos, newPos);
    } catch (_) {}
  });
}
