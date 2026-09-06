"""
Plantilla HTML del correo de verificación, centrada, con el logo real de
Clerkship (hosteado como PNG, ver _LOGO_URL; el base64 inline de un SVG no
se renderizaba bien en Gmail, quedaba como ícono roto), colores de marca (el
mismo azul del resto de la plataforma) y layout con tablas (no flexbox/grid),
que es lo único que Outlook renderiza bien de forma consistente en correos
HTML.
"""

_LOGO_URL = "https://i.ibb.co/4RM6DyJj/Clerkship.png"


def verification_email_html(first_name: str, code: str) -> str:
    return f"""\
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#F1F5F9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:36px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0"
        style="width:480px;max-width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;font-family:'Segoe UI',Helvetica,Arial,sans-serif;box-shadow:0 4px 24px rgba(2,132,199,0.10);">

        <tr>
          <td style="padding:36px 40px 24px;text-align:center;">
            <img src="{_LOGO_URL}" width="96" height="118" alt="Clerkship"
              style="display:block;margin:0 auto;border:0;" />
          </td>
        </tr>

        <tr>
          <td style="height:4px;line-height:4px;font-size:0;background-color:#0369A1;background-image:linear-gradient(90deg,#0284C7,#0369A1);">&nbsp;</td>
        </tr>

        <tr>
          <td style="padding:32px 40px 4px;text-align:center;">
            <p style="margin:0 0 6px;color:#64748B;font-size:13.5px;">Hola {first_name},</p>
            <h1 style="margin:0 0 14px;color:#0F172A;font-size:21px;font-weight:800;">Confirmá tu correo</h1>
            <p style="margin:0 0 26px;color:#475569;font-size:14px;line-height:1.65;">
              Usá este código para terminar de crear tu cuenta en Clerkship. Vence en <strong>10 minutos</strong>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center"
                  style="background-color:#0369A1;background-image:linear-gradient(135deg,#0284C7,#0369A1);border-radius:16px;padding:22px 12px;">
                  <span style="font-size:32px;font-weight:800;letter-spacing:9px;color:#FFFFFF;font-family:'Courier New',Consolas,monospace;">{code}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 34px;text-align:center;">
            <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.6;">
              Si no creaste una cuenta en Clerkship, podés ignorar este correo con tranquilidad.
              Nadie más puede usar tu dirección sin este código.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:18px 40px;text-align:center;">
            <p style="margin:0;color:#94A3B8;font-size:11px;">© Clerkship · Plataforma de educación médica</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
"""
