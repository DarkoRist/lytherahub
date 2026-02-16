import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: February 16, 2026</p>

        <div className="mt-10 space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. What Are Cookies</h2>
            <p className="text-sm">Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences, keep you logged in, and understand how you use the service. Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain until they expire or you delete them).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. How We Use Cookies</h2>
            <p className="text-sm">LytheraHub uses cookies and similar technologies (such as localStorage) to provide, secure, and improve our Service. We use cookies to authenticate your session, remember your preferences (such as theme and sidebar state), and analyze how our Service is used so we can improve it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Types of Cookies We Use</h2>

            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Essential Cookies</h3>
                <p className="text-sm mb-2">These cookies are required for the Service to function and cannot be disabled.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800">
                        <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Cookie</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Purpose</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="px-4 py-2">lytherahub_token</td>
                        <td className="px-4 py-2">Authentication session token</td>
                        <td className="px-4 py-2">Session</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">lytherahub_refresh</td>
                        <td className="px-4 py-2">Token refresh for persistent login</td>
                        <td className="px-4 py-2">30 days</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">lytherahub_theme</td>
                        <td className="px-4 py-2">Stores your light/dark mode preference</td>
                        <td className="px-4 py-2">Persistent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Analytics Cookies</h3>
                <p className="text-sm mb-2">These cookies help us understand how visitors interact with the Service. All analytics data is aggregated and anonymized.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800">
                        <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Cookie</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Purpose</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="px-4 py-2">_analytics_id</td>
                        <td className="px-4 py-2">Distinguish unique visitors</td>
                        <td className="px-4 py-2">1 year</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">_analytics_session</td>
                        <td className="px-4 py-2">Track page views within a session</td>
                        <td className="px-4 py-2">30 minutes</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Marketing Cookies</h3>
                <p className="text-sm">We do not currently use marketing or advertising cookies. If this changes in the future, we will update this policy and request your consent before setting any marketing cookies.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Managing Cookies</h2>
            <p className="text-sm mb-3">You can control and manage cookies in several ways:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Browser Settings:</strong> Most browsers allow you to view, delete, and block cookies through the settings or preferences menu.</li>
              <li><strong>Essential Cookies:</strong> Please note that disabling essential cookies will prevent the Service from functioning properly — you will not be able to log in or use authenticated features.</li>
              <li><strong>Analytics Opt-Out:</strong> You can opt out of analytics cookies by contacting us at privacy@lytherahub.com or by using your browser's Do Not Track setting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Changes to This Policy</h2>
            <p className="text-sm">We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We will notify you of material changes by posting the updated policy on this page with a new "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Contact Us</h2>
            <p className="text-sm">If you have questions about our use of cookies, contact us at:</p>
            <div className="mt-3 text-sm">
              <p><strong>LytheraHub GmbH</strong></p>
              <p>Email: privacy@lytherahub.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
