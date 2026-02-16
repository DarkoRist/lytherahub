import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: February 16, 2026</p>

        <div className="mt-10 space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm">By accessing or using LytheraHub ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms constitute a legally binding agreement between you and LytheraHub GmbH ("we", "us", "our"). We may update these Terms from time to time; continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Account Registration</h2>
            <p className="text-sm mb-3">To use LytheraHub, you must create an account using Google OAuth or other supported authentication methods. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Provide accurate and complete information during registration.</li>
              <li>Maintain the security of your account credentials and access tokens.</li>
              <li>Notify us immediately of any unauthorized access to your account.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
            </ul>
            <p className="mt-3 text-sm">You must be at least 18 years old or have the legal capacity to enter into a binding contract in your jurisdiction to use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Subscription & Billing</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Free Plan:</strong> Available at no cost with limited features as described on our pricing page.</li>
              <li><strong>Paid Plans:</strong> Pro and Business plans are billed monthly or annually at the rates displayed on our pricing page. Prices are in Euros (EUR) and exclude applicable taxes.</li>
              <li><strong>Payment:</strong> Payments are processed securely via Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time from your Settings page. Upon cancellation, you retain access until the end of your current billing period.</li>
              <li><strong>Refunds:</strong> We offer a 14-day money-back guarantee on paid plans. After 14 days, refunds are not available for partial billing periods.</li>
              <li><strong>Price Changes:</strong> We may change our prices with 30 days' notice. Price changes will take effect at the start of your next billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Acceptable Use</h2>
            <p className="text-sm mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Violate any applicable laws, regulations, or third-party rights.</li>
              <li>Send spam, phishing emails, or other unsolicited communications.</li>
              <li>Attempt to gain unauthorized access to other users' accounts or our systems.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
              <li>Use the Service to store or transmit malicious code, viruses, or harmful content.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Use automated means to access the Service except through our published APIs.</li>
              <li>Resell or redistribute the Service without our written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Intellectual Property</h2>
            <p className="text-sm mb-3">The Service, including its design, code, features, and documentation, is owned by LytheraHub GmbH and protected by intellectual property laws. You retain ownership of all data you submit to the Service. By using the Service, you grant us a limited license to process your data solely for the purpose of providing the Service to you.</p>
            <p className="text-sm">We do not claim ownership of your business data, emails, documents, or other content you process through LytheraHub.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Limitation of Liability</h2>
            <p className="text-sm mb-3">To the maximum extent permitted by applicable law:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied.</li>
              <li>We do not warrant that the Service will be uninterrupted, error-free, or secure.</li>
              <li>Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
              <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">7. Termination</h2>
            <p className="text-sm">We may suspend or terminate your access to the Service if you violate these Terms, engage in fraudulent activity, or fail to pay applicable fees. Upon termination, your right to use the Service ceases immediately. We will provide you with an opportunity to export your data for 30 days following termination, unless the termination is due to illegal activity. You may terminate your account at any time by contacting us or through the Settings page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">8. Governing Law</h2>
            <p className="text-sm">These Terms are governed by and construed in accordance with the laws of the Federal Republic of Germany, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Berlin, Germany. For consumers within the European Union, mandatory consumer protection laws of your country of residence may also apply.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">9. Changes to Terms</h2>
            <p className="text-sm">We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the modified Terms. If you do not agree with the changes, you must stop using the Service and close your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">10. Contact</h2>
            <p className="text-sm">If you have questions about these Terms, contact us at:</p>
            <div className="mt-3 text-sm">
              <p><strong>LytheraHub GmbH</strong></p>
              <p>Email: legal@lytherahub.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
