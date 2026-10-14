const nodemailer = require("nodemailer");

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Gửi email xác minh danh tính với con số xác nhận thực tế đến hòm thư người dùng
 */
async function sendIdentityEmail(toEmail, correctNumber, provider = "Google") {
  const transporter = createTransporter();
  const senderUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
  const fromAddress = process.env.EMAIL_FROM || `"Lộc App - Xác minh danh tính" <${senderUser}>`;

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #123F38, #1F6F63); padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Lộc — Quản Lý Tài Chính Sinh Viên</h2>
        <p style="margin: 6px 0 0; font-size: 13.5px; opacity: 0.9;">Xác minh danh tính liên kết ${provider}</p>
      </div>
      <div style="padding: 28px 24px; text-align: center; color: #20302C;">
        <p style="font-size: 15px; margin: 0 0 16px; line-height: 1.5;">
          Bạn vừa yêu cầu đăng nhập hoặc liên kết tài khoản qua <strong>${provider}</strong>.
        </p>
        <p style="font-size: 14px; color: #5B6660; margin: 0 0 24px; line-height: 1.5;">
          Để xác nhận danh tính, vui lòng quay lại màn hình ứng dụng và <strong>bấm chọn con số sau đây</strong> trong số 3 con số đang hiển thị:
        </p>
        <div style="margin: 22px 0;">
          <div style="display: inline-block; font-size: 54px; font-weight: 800; color: #123F38; background: #F1EEE3; border: 2.5px dashed #1F6F63; padding: 14px 44px; border-radius: 16px; letter-spacing: 4px; box-shadow: 0 4px 12px rgba(31,111,99,0.15);">
            ${correctNumber}
          </div>
        </div>
        <div style="font-size: 12.5px; color: #8C6620; background: #FFF9E6; border: 1px solid #F5E6B3; padding: 12px 14px; border-radius: 8px; margin: 24px 0 0; text-align: left; line-height: 1.5;">
          ⚠️ <strong>Lưu ý an toàn:</strong> Con số xác minh này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ cho người khác. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
        </div>
      </div>
      <div style="background: #F8F9FA; padding: 14px 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee;">
        © 2026 Lộc Project — Đề tài Nghiên cứu Khoa học Sinh viên
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[MAIL MOCK] Chưa cấu hình SMTP_PASS trong .env. Mô phỏng gửi email tới ${toEmail} với số xác nhận: ${correctNumber}`);
    return { sent: false, mock: true, code: correctNumber };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[Lộc App] ${correctNumber} là số xác minh danh tính tài khoản của bạn`,
      html,
    });
    console.log(`[MAIL SENT] Đã gửi email xác minh danh tính tới ${toEmail}, MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId, code: correctNumber };
  } catch (err) {
    console.error(`[MAIL ERROR] Lỗi gửi email qua SMTP:`, err.message);
    return { sent: false, error: err.message, mock: true, code: correctNumber };
  }
}

module.exports = { sendIdentityEmail };
