import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'workspace_invite' | 'alert' | 'scheduled_report';
  recipientEmail: string;
  recipientName?: string;
  data: {
    workspaceName?: string;
    inviterName?: string;
    inviteRole?: string;
    alertTitle?: string;
    alertMessage?: string;
    alertType?: string;
    reportTitle?: string;
    reportType?: string;
    reportPeriod?: string;
  };
}

const getEmailTemplate = (type: string, data: any): { subject: string; html: string } => {
  const brandColor = '#DC2626';
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  const header = `
    <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 30px; text-align: center;">
      <h1 style="color: ${brandColor}; margin: 0; font-size: 28px; font-weight: bold;">
        α <span style="color: #ffffff;">ALPHADATA</span>
      </h1>
      <p style="color: #94A3B8; margin: 8px 0 0 0; font-size: 14px;">
        Inteligência de Mercado Petrolífero Angolano
      </p>
    </div>
  `;

  const footer = `
    <div style="background: #F1F5F9; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="color: #64748B; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} AlphaData. Todos os direitos reservados.
      </p>
      <p style="color: #94A3B8; font-size: 11px; margin: 8px 0 0 0;">
        Este email foi enviado automaticamente. Por favor não responda.
      </p>
    </div>
  `;

  switch (type) {
    case 'workspace_invite':
      return {
        subject: `Convite para o Workspace "${data.workspaceName}" - AlphaData`,
        html: `
          <div style="${baseStyles}">
            ${header}
            <div style="padding: 30px;">
              <h2 style="color: #0F172A; margin: 0 0 20px 0; font-size: 22px;">
                Convite de Workspace
              </h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,<br><br>
                <strong>${data.inviterName || 'Um colega'}</strong> convidou-o para se juntar ao workspace 
                <strong style="color: ${brandColor};">"${data.workspaceName}"</strong> na plataforma AlphaData.
              </p>
              <div style="background: #F8FAFC; border-left: 4px solid ${brandColor}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #334155; margin: 0; font-size: 14px;">
                  <strong>Função atribuída:</strong> ${data.inviteRole === 'admin' ? 'Administrador' : data.inviteRole === 'editor' ? 'Editor' : 'Visualizador'}
                </p>
              </div>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                Como membro deste workspace, terá acesso a relatórios partilhados, análises de mercado 
                e poderá colaborar com a sua equipa em tempo real.
              </p>
              <a href="https://dadosalfa.lovable.app/workspace" 
                 style="display: inline-block; background: ${brandColor}; color: #ffffff; padding: 14px 28px; 
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Aceitar Convite
              </a>
            </div>
            ${footer}
          </div>
        `,
      };

    case 'alert':
      const alertColors: Record<string, string> = {
        critical: '#DC2626',
        warning: '#F59E0B',
        info: '#3B82F6',
      };
      const alertColor = alertColors[data.alertType] || alertColors.info;
      
      return {
        subject: `⚠️ Alerta: ${data.alertTitle} - AlphaData`,
        html: `
          <div style="${baseStyles}">
            ${header}
            <div style="padding: 30px;">
              <h2 style="color: ${alertColor}; margin: 0 0 20px 0; font-size: 20px;">
                ⚠️ ${data.alertTitle}
              </h2>
              <div style="background: ${alertColor}10; border: 1px solid ${alertColor}30; padding: 20px; 
                          border-radius: 10px; margin: 20px 0;">
                <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0;">
                  ${data.alertMessage}
                </p>
              </div>
              <p style="color: #64748B; font-size: 13px; margin: 20px 0 25px 0;">
                Este alerta foi gerado em ${new Date().toLocaleString('pt-AO', { 
                  dateStyle: 'long', 
                  timeStyle: 'short' 
                })}
              </p>
              <a href="https://dadosalfa.lovable.app/alerts" 
                 style="display: inline-block; background: #0F172A; color: #ffffff; padding: 14px 28px; 
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Ver Detalhes do Alerta
              </a>
            </div>
            ${footer}
          </div>
        `,
      };

    case 'scheduled_report':
      return {
        subject: `📊 Relatório "${data.reportTitle}" Disponível - AlphaData`,
        html: `
          <div style="${baseStyles}">
            ${header}
            <div style="padding: 30px;">
              <h2 style="color: #0F172A; margin: 0 0 20px 0; font-size: 22px;">
                📊 Novo Relatório Disponível
              </h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                O seu relatório agendado foi gerado com sucesso e está pronto para download.
              </p>
              <div style="background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%); 
                          padding: 20px; border-radius: 12px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Título</td>
                    <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.reportTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Tipo</td>
                    <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.reportType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Período</td>
                    <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">${data.reportPeriod}</td>
                  </tr>
                </table>
              </div>
              <a href="https://dadosalfa.lovable.app/reports" 
                 style="display: inline-block; background: ${brandColor}; color: #ffffff; padding: 14px 28px; 
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Ver e Descarregar Relatório
              </a>
            </div>
            ${footer}
          </div>
        `,
      };

    default:
      return {
        subject: 'Notificação AlphaData',
        html: `<p>Notificação da plataforma AlphaData.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipientEmail, recipientName, data }: EmailRequest = await req.json();

    if (!type || !recipientEmail) {
      throw new Error("Missing required fields: type and recipientEmail");
    }

    const { subject, html } = getEmailTemplate(type, data);

    // Log the email notification
    await supabase.from('email_notifications').insert({
      recipient_email: recipientEmail,
      notification_type: type,
      subject: subject,
      status: 'sending',
      metadata: { recipientName, ...data },
    });

    // Send the email using Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AlphaData <noreply@alphadata.ao>',
        to: [recipientEmail],
        subject: subject,
        html: html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || 'Failed to send email');
    }

    // Update notification status
    await supabase
      .from('email_notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('recipient_email', recipientEmail)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, data: emailResult }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);

    // Log failed email
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const body = await req.clone().json().catch(() => ({}));
      await supabase.from('email_notifications').insert({
        recipient_email: body.recipientEmail || 'unknown',
        notification_type: body.type || 'unknown',
        subject: 'Failed to send',
        status: 'failed',
        error_message: error.message,
        metadata: body.data || {},
      });
    } catch (logError) {
      console.error("Error logging failed email:", logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
