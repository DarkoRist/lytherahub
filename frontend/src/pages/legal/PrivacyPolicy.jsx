import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: February 16, 2026</p>

        <div className="mt-10 space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly when you create an account, use our services, or contact us:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Account Information:</strong> Name, email address, business name, and profile picture when you sign in via Google OAuth.</li>
              <li><strong>Connected Services Data:</strong> When you connect Gmail, Google Calendar, Stripe, or Slack, we access data from those services as authorized by you to provide our features (email metadata, calendar events, invoice data, messages).</li>
              <li><strong>Usage Data:</strong> How you interact with LytheraHub, including pages visited, features used, and preferences configured.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers for security and analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Provide, maintain, and improve LytheraHub's services and features.</li>
              <li>Process and classify your emails, calendar events, and invoices using AI.</li>
              <li>Generate reports, briefings, and actionable insights for your business.</li>
              <li>Send you service-related notifications, updates, and security alerts.</li>
              <li>Provide customer support and respond to your inquiries.</li>
              <li>Detect, prevent, and address fraud, abuse, and security issues.</li>
              <li>Comply with legal obligations and enforce our terms of service.</li>
            </ul>
            <p className="mt-3 text-sm">We do <strong>not</strong> sell your personal data to third parties. We do not use your data for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Data Storage & Security</h2>
            <p className="mb-3 text-sm">We take the security of your data seriously and implement industry-standard measures:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
              <li>Data is stored in secure, SOC 2-compliant data centers within the European Union.</li>
              <li>Multi-tenant architecture ensures strict data isolation between accounts.</li>
              <li>Regular security audits, penetration testing, and vulnerability assessments.</li>
              <li>Access to production systems is restricted to authorized personnel with multi-factor authentication.</li>
              <li>Automated backups with point-in-time recovery capabilities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3 text-sm">We integrate with the following third-party services to provide our features:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Google APIs:</strong> Gmail, Calendar, Drive, and Sheets for email, scheduling, and document management.</li>
              <li><strong>Stripe:</strong> Payment processing for subscriptions and billing.</li>
              <li><strong>Slack:</strong> Notifications and bot interactions.</li>
              <li><strong>AI Providers:</strong> We use AI language models to process and analyze your business data. Your data is processed in accordance with our data processing agreements and is not used to train AI models.</li>
            </ul>
            <p className="mt-3 text-sm">Each third-party service has its own privacy policy. We encourage you to review them. We only share the minimum data necessary with each service to provide the functionality you have requested.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Your Rights (GDPR)</h2>
            <p className="mb-3 text-sm">Under the General Data Protection Regulation (GDPR) and applicable EU/EEA data protection laws, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Right of Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Right to Restriction:</strong> Request restriction of processing of your personal data.</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p className="mt-3 text-sm">To exercise any of these rights, contact us at <strong>privacy@lytherahub.com</strong>. We will respond within 30 days as required by GDPR. You also have the right to lodge a complaint with your local data protection authority.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Cookies</h2>
            <p className="text-sm">We use essential cookies to maintain your session and preferences. We also use analytics cookies to understand how our service is used. For full details, please see our <Link to="/cookies" className="text-brand-600 hover:text-brand-700 underline">Cookie Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">7. Data Retention</h2>
            <p className="text-sm">We retain your personal data for as long as your account is active or as needed to provide you services. When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain data for legal, tax, or compliance purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">8. Contact Us</h2>
            <p className="text-sm">If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <div className="mt-3 text-sm">
              <p><strong>LytheraHub GmbH</strong></p>
              <p>Email: privacy@lytherahub.com</p>
              <p>Data Protection Officer: dpo@lytherahub.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
