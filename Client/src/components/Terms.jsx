import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Terms - Terms and Conditions component
 * Can be rendered as a modal (with isOpen/onClose) or as a standalone page (route)
 */
const Terms = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const isModal = isOpen !== undefined;

  // Scroll to top when component loads as a page (not modal)
  useEffect(() => {
    if (!isModal) {
      // Scroll immediately to top
      window.scrollTo(0, 0);
    }
  }, [isModal]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const content = (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Terms and Conditions</h1>
        {isModal && (
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-8 text-gray-700">
        {/* Section 1: Introduction and Acceptance */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Section 1: Introduction and Acceptance</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Introduction & Definitions</h3>
              <p className="text-gray-600 mb-2">
                This website and service is operated by <strong>JAYS KERALA INNOVATIONS PRIVATE LIMITED</strong> (hereinafter referred to as "Company," "we," "us," or "our").
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Contact Information:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-600 mb-4">
                <li>Email: [Your Contact Email]</li>
                <li>Address: [Your Business Address]</li>
                <li>Phone: [Your Contact Number]</li>
              </ul>
              <p className="text-gray-600 mb-2"><strong>Key Definitions:</strong></p>
              <ul className="list-disc list-inside ml-4 text-gray-600">
                <li><strong>"Website"</strong> refers to our online platform and all associated web pages, content, and services.</li>
                <li><strong>"User"</strong> refers to any individual, entity, or organization that accesses or uses the Website or our services.</li>
                <li><strong>"Content"</strong> refers to all text, images, graphics, logos, software, trademarks, and other materials displayed on or accessible through the Website.</li>
                <li><strong>"Service"</strong> refers to all services provided by us through the Website.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Acceptance of Terms</h3>
              <p className="text-gray-600 mb-2">
                By accessing or using the website/service, you agree to be legally bound by these Terms and Conditions.
              </p>
              <p className="text-gray-600">
                <strong>Method of Acceptance:</strong> The method of acceptance may be Browsewrap (simply using the site implies acceptance) or Clickwrap (requiring an affirmative click to agree).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Changes to Terms</h3>
              <p className="text-gray-600 mb-2">
                We reserve the right to modify the terms at any time.
              </p>
              <p className="text-gray-600">
                <strong>Notification:</strong> Users will be notified of significant changes through email or by posting on the website.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Rules for Users (Acceptable Use) */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Section 2: Rules for Users (Acceptable Use)</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">User Conduct and Prohibited Activities</h3>
              <p className="text-gray-600 mb-2">The following actions are not allowed:</p>
              <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
                <li>Using the site for illegal purposes</li>
                <li>Transmitting viruses or malicious code</li>
                <li>Harassment or abusive behavior</li>
                <li>Spamming</li>
                <li>Attempting to hack or breach security</li>
                <li>Any other activity that violates applicable laws or regulations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Copyright/IP Infringement</h3>
              <p className="text-gray-600">
                Users are explicitly forbidden from copying, modifying, or distributing the website's protected content without written permission from the Company.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">User-Generated Content</h3>
              <p className="text-gray-600 mb-2">If users can post comments, reviews, or upload content:</p>
              <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
                <li>The user is solely responsible for their submitted content</li>
                <li>The website is granted a license to use, display, modify, and distribute that content on the platform</li>
                <li>We reserve the right to remove objectionable content</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Age Restrictions</h3>
              <p className="text-gray-600">
                Users must meet the minimum age required to use the service (especially important for data privacy compliance). The minimum age requirement is 18 years, or as specified by applicable laws.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Intellectual Property Protection */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Section 3: Intellectual Property Protection</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Intellectual Property (IP) Rights</h3>
              <p className="text-gray-600 mb-4">
                <strong>Ownership:</strong> The website, its logo, content, software, and trademarks are the exclusive property of JAYS KERALA INNOVATIONS PRIVATE LIMITED and are protected by Indian and international copyright and trademark laws.
              </p>
              <p className="text-gray-600">
                <strong>License to User:</strong> Users are allowed to access and view the content for personal, non-commercial viewing only. Users are NOT allowed to reproduce, modify, or distribute the content without written permission from the Company.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Commercial and Financial Terms */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Section 4: Commercial and Financial Terms</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Products, Services, Pricing, and Payment</h3>
              <p className="text-gray-600 mb-2">Accepted payment methods, pricing structure, billing cycles, and applicable taxes will be detailed on the Website or at the time of purchase.</p>
              <p className="text-gray-600">
                All prices are subject to change without prior notice. Prices displayed are inclusive of applicable taxes unless otherwise stated.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Refund, Cancellation, and Returns Policy</h3>
              <p className="text-gray-600">
                The conditions under which a user can cancel a service or return a product are clearly outlined. Once payment for the meal plan is made, refunds will not be available. In case you don't want an order you placed delivered, we can stop delivery if informed in advance. However, the order won't be carried forward to another day or no payment credits will be availed.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Legal & Liability Clauses */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Section 5: Legal & Liability Clauses</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Disclaimer of Warranties</h3>
              <p className="text-gray-600">
                The website/service is provided on an "AS IS" and "AS AVAILABLE" basis. All express or implied warranties regarding accuracy, reliability, or uninterrupted service are excluded to the maximum extent permitted by law.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Limitation of Liability</h3>
              <p className="text-gray-600 mb-2">
                The company will not be liable for any indirect, incidental, punitive, or consequential damages arising from the use (or inability to use) the website, up to the maximum extent permitted by law.
              </p>
              <p className="text-gray-600">
                The maximum financial liability cap may be limited to the amount paid by the user in the last six months, or as otherwise specified by applicable law.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Indemnification</h3>
              <p className="text-gray-600">
                Users are required to indemnify (defend and hold harmless) the company against any claims or legal fees arising from the user's breach of these terms or their use of the service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Termination of Agreement</h3>
              <p className="text-gray-600 mb-2">
                <strong>Company's Right to Terminate:</strong> The company can suspend or terminate a user's account for breach of terms or any other reason deemed necessary by the Company.
              </p>
              <p className="text-gray-600">
                <strong>User's Right to Terminate:</strong> Users may terminate their account at any time by contacting the Company or through account settings if available.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Governing Law and Jurisdiction</h3>
              <p className="text-gray-600 mb-2">
                These Terms and Conditions shall be governed by the laws of India.
              </p>
              <p className="text-gray-600">
                <strong>Jurisdiction:</strong> Any legal disputes will be heard in the courts in Kochi, Kerala, India.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Dispute Resolution</h3>
              <p className="text-gray-600">
                In the event of disputes, the parties agree to first attempt resolution through negotiation, mediation, or mandatory Arbitration before resorting to court. The arbitration shall be conducted in accordance with the Arbitration and Conciliation Act, 2015 of India, or as otherwise specified.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Miscellaneous */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Section 6: Miscellaneous</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Privacy Policy Link</h3>
              <p className="text-gray-600">
                The use of the website is also governed by our Privacy Policy. Please refer to our Privacy Policy for information on how we collect, use, and protect your personal information. [Privacy Policy Link]
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
              <p className="text-gray-600 mb-2">
                For legal queries or support requests, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>JAYS KERALA INNOVATIONS PRIVATE LIMITED</strong></p>
                <p className="text-gray-600">Email: [Your Contact Email]</p>
                <p className="text-gray-600">Address: [Your Business Address]</p>
                <p className="text-gray-600">Phone: [Your Contact Number]</p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This outline is for informational purposes only and does not constitute legal advice. The enforceability of any clause can depend on how clearly it is written, how the user agrees to it (Clickwrap is generally stronger than Browsewrap), and its alignment with current Indian statutes like the Information Technology Act, 2000 and the Indian Contract Act, 1872.
          </p>
          <p className="text-sm text-gray-700 mt-2">
            You should have your final Terms and Conditions document reviewed by a qualified legal professional in India.
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {isModal && (
        <div className="mt-8">
          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      )}
    </>
  );

  // Render as modal if isOpen prop is provided
  if (isModal) {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Render as standalone page
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Terms;
