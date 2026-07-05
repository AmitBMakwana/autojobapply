'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UpgradePricingPage() {
  const [currentPlan, setCurrentPlan] = useState('Free Plan');
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly', 'quarterly'

  // Calculator state
  const [jobsPerWeek, setJobsPerWeek] = useState(25);
  const [minsPerJob, setMinsPerJob] = useState(20);
  const [hoursSaved, setHoursSaved] = useState(0);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    setCurrentPlan(localStorage.getItem('jobforge_plan') || 'Free Plan');
  }, []);

  // Update calculator output
  useEffect(() => {
    // Total jobs in a month = jobsPerWeek * 4.33
    // Total minutes spent = jobs * minsPerJob
    // With AI: tailors resume in 30s (0.5 mins) + autofill in 1 min = 1.5 mins per job
    // Time saved per job = minsPerJob - 1.5
    const monthlyJobs = jobsPerWeek * 4.33;
    const timeSavedMins = monthlyJobs * Math.max(0, minsPerJob - 1.5);
    const calculatedHours = Math.round(timeSavedMins / 60);
    setHoursSaved(calculatedHours);
  }, [jobsPerWeek, minsPerJob]);

  const handleUpgrade = (planName) => {
    const fullPlanName = `${planName} Plan`;
    localStorage.setItem('jobforge_plan', fullPlanName);
    setCurrentPlan(fullPlanName);
    window.dispatchEvent(new Event('storage'));
    alert(`Successfully upgraded to the ${fullPlanName}!`);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const getPlanPrice = (planName) => {
    if (planName === 'Free') return { price: '$0', displayPeriod: 'forever' };
    if (billingPeriod === 'monthly') {
      if (planName === 'Basic') return { price: '$9.99', displayPeriod: '/mo' };
      if (planName === 'Pro') return { price: '$19.99', displayPeriod: '/mo' };
      if (planName === 'Elite') return { price: '$39.99', displayPeriod: '/mo' };
    } else {
      // Quarterly pricing (discounted monthly rate)
      if (planName === 'Basic') return { price: '$5.99', displayPeriod: '/mo (billed quarterly)' };
      if (planName === 'Pro') return { price: '$11.99', displayPeriod: '/mo (billed quarterly)' };
      if (planName === 'Elite') return { price: '$23.99', displayPeriod: '/mo (billed quarterly)' };
    }
  };

  const plans = [
    {
      name: 'Free',
      desc: 'To try out AI matchmaking',
      features: [
        '6 job extractions / mo',
        '2 tailored resumes / mo',
        'Basic fit score matching',
        'Standard dashboard access'
      ],
      buttonText: 'Current Plan',
      style: 'bg-white/[0.01] border-white/5 opacity-80'
    },
    {
      name: 'Basic',
      desc: 'For active job seekers',
      features: [
        '15 tailored resumes / month',
        '40 cover letters / month',
        '3 resume uploads',
        'Application analytics & insights',
        'Priority Discord support'
      ],
      buttonText: 'Upgrade to Basic',
      style: 'bg-white/[0.02] border-white/5'
    },
    {
      name: 'Pro',
      desc: 'For serious applicants',
      features: [
        '300 tailored resumes / month',
        '200 cover letters / month',
        'Unlimited resume uploads',
        'Application analytics + insights',
        'Priority Discord support'
      ],
      buttonText: 'Upgrade to Pro',
      recommended: true,
      style: 'bg-purple-950/20 border-purple-500 shadow-xl shadow-purple-500/10'
    },
    {
      name: 'Elite',
      desc: 'For power users and teams',
      features: [
        '1,500 job analyses / month',
        '1,000 tailored resumes / month',
        '700 cover letters / month',
        'Unlimited resume uploads',
        'Dedicated 1-on-1 career assistance',
        'Premium Discord community access'
      ],
      buttonText: 'Upgrade to Elite',
      style: 'bg-white/[0.02] border-white/5'
    }
  ];

  const faqs = [
    {
      q: 'How does the 100% money-back guarantee work?',
      a: 'If you are not satisfied with JobForge AI within the first 14 days of your subscription, simply reach out to our team or contact support and we will issue a full 100% refund immediately.'
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes, absolutely. You can cancel, upgrade, or downgrade your plan directly from the Billing section inside Account settings in one click. No questions asked.'
    },
    {
      q: 'What is the difference between Basic, Pro, and Elite?',
      a: 'The plans differ primarily in tailoring limits: Basic is suited for lightweight searches (15 resumes), Pro is optimized for serious applicants (300 resumes), and Elite offers unlimited power and premium Slack/community access.'
    },
    {
      q: 'Does the auto-apply feature work on all job boards?',
      a: 'Yes! The JobForge AI Chrome extension supports major application systems including Greenhouse, Lever, Workday, BambooHR, LinkedIn Easy Apply, and standard company careers portals.'
    },
    {
      q: 'Can I download my tailored resumes as PDFs?',
      a: 'Yes, all tailored resumes and cover letters generated inside the Resume tab can be downloaded instantly as fully ATS-optimized, formatted PDFs or DOCX files.'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative text-left">

      {/* Ambient background glowing orbs */}
      <div className="absolute top-[5%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blob-purple opacity-15 pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blob-cyan opacity-10 pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto space-y-16 z-10 relative">

        {/* Header */}
        <div className="text-center space-y-5">
          <div className="inline-block px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
            All plans include a 100% Money-Back Guarantee
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto">
            4x More Interviews For <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Less Than $1/Day</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Automate your job sourcing, resume customization, and cover letter tailoring. Billed monthly or quarterly.
          </p>

          {/* Pricing Toggle Switch */}
          <div className="flex items-center justify-center pt-4">
            <div className="bg-[#0b0c16] border border-white/5 p-1 rounded-xl flex items-center relative select-none">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${billingPeriod === 'monthly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('quarterly')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5 ${billingPeriod === 'quarterly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Quarterly
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded font-black uppercase">
                  Save 40%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(p => {
            const { price, displayPeriod } = getPlanPrice(p.name);
            const isPlanActive = currentPlan === `${p.name} Plan` || (p.name === 'Free' && currentPlan === 'Free Plan');

            return (
              <div
                key={p.name}
                className={`rounded-3xl p-6 border flex flex-col justify-between relative transition-all duration-300 hover:scale-102 ${p.style}`}
              >
                {p.recommended && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wide">{p.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 min-h-[32px]">{p.desc}</p>
                    <div className="flex items-baseline mt-3">
                      <span className="text-2xl font-black text-white">{price}</span>
                      <span className="text-xs text-gray-500 ml-1">{displayPeriod}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-400 pt-4 border-t border-white/5">
                    {p.features.map(f => (
                      <li key={f} className="flex gap-2 items-center">
                        <span className="text-emerald-400 text-sm">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isPlanActive || p.name === 'Free'}
                  onClick={() => handleUpgrade(p.name)}
                  className={`w-full mt-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-98 cursor-pointer ${isPlanActive
                      ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                      : p.recommended
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                >
                  {isPlanActive ? 'Current Plan' : p.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-6 pt-8 border-t border-white/5">
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-white">Compare every feature, side by side</h2>
            <p className="text-xs text-gray-500 mt-1">Get complete transparency on matching allowances and support tiers.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0c0d19]/60 shadow-xl" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-left text-xs text-gray-300 min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0b18]/80 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="p-4">Feature</th>
                  <th className="p-4">Basic</th>
                  <th className="p-4 text-purple-300">Pro (Recommended)</th>
                  <th className="p-4">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 font-bold text-white">Tailored Resumes</td>
                  <td className="p-4">15 / month</td>
                  <td className="p-4 text-purple-300 font-bold bg-purple-500/[0.02]">300 / month</td>
                  <td className="p-4">1,000 / month</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Cover Letters</td>
                  <td className="p-4">40 / month</td>
                  <td className="p-4 text-purple-300 font-bold bg-purple-500/[0.02]">200 / month</td>
                  <td className="p-4">700 / month</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Resume Uploads</td>
                  <td className="p-4">3 uploads</td>
                  <td className="p-4 text-emerald-400 bg-purple-500/[0.02]">Unlimited</td>
                  <td className="p-4 text-emerald-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Auto-fill Forms</td>
                  <td className="p-4">Standard</td>
                  <td className="p-4 text-emerald-400 bg-purple-500/[0.02]">✓ Plus Insights</td>
                  <td className="p-4 text-emerald-400">✓ Plus Insights</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Dedicated Support</td>
                  <td className="p-4">Standard Email</td>
                  <td className="p-4 text-purple-300 bg-purple-500/[0.02]">Priority Discord</td>
                  <td className="p-4">1-on-1 Slack Assistance</td>
                </tr>
                <tr className="bg-[#0a0b18]/40">
                  <td className="p-4"></td>
                  <td className="p-4">
                    <button
                      onClick={() => handleUpgrade('Basic')}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
                    >
                      Choose Basic
                    </button>
                  </td>
                  <td className="p-4 bg-purple-500/[0.02]">
                    <button
                      onClick={() => handleUpgrade('Pro')}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider transition shadow-md shadow-purple-500/10 cursor-pointer"
                    >
                      Choose Pro
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleUpgrade('Elite')}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
                    >
                      Choose Elite
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reactive Hour Calculator */}
        <div className="p-8 rounded-3xl bg-[#0c0d19]/80 border border-white/5 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-block px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase">
              ROI Calculator
            </div>
            <h3 className="text-xl font-extrabold text-white">How many hours could you save this month?</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We calculated the total time spent tailoring files and auto-submitting job forms compared to our instant 1-click matching engine.
            </p>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Applications submitted per week</span>
                  <span className="text-purple-400">{jobsPerWeek} jobs</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={jobsPerWeek}
                  onChange={(e) => setJobsPerWeek(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Average mins per application manually</span>
                  <span className="text-purple-400">{minsPerJob} mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={minsPerJob}
                  onChange={(e) => setMinsPerJob(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center space-y-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time Saved Monthly</span>
            <div className="text-5xl font-black text-emerald-400 tracking-tight animate-pulse">
              {hoursSaved} <span className="text-sm font-bold text-gray-400">hours</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (hoursSaved / 60) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[240px] pt-2">
              That's equivalent to <strong className="text-white">{(hoursSaved / 8).toFixed(1)} full working days</strong> saved every single month!
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-white">160+ job seekers can't be wrong</h2>
            <p className="text-xs text-gray-500 mt-1">Here is what verified engineers, analysts, and project managers are saying.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: "Tailors my resume to any job post in under 30 seconds. Saved me countless hours of manual editing.",
                author: "Hassan Iftikhar",
                role: "Data Analyst",
                initials: "HI"
              },
              {
                text: "The auto-fill feature works like magic on Greenhouse and Lever. Instantly maps tailored details into input boxes.",
                author: "Rohan Patel",
                role: "React Engineer",
                initials: "RP"
              },
              {
                text: "Matched 94% on a remote Full-Stack opening, and got requested for an interview within 48 hours. Unreal!",
                author: "Sneha Nair",
                role: "Product Designer",
                initials: "SN"
              }
            ].map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 shadow-lg hover:border-white/10 transition">
                <div className="text-purple-400 text-lg">★★★★★</div>
                <p className="text-xs text-gray-300 italic leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-extrabold text-[10px] text-white">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t.author}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why we built JobForge AI info segment */}
        <div className="p-8 rounded-3xl bg-[#0c0d19]/80 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-4xl shrink-0 select-none">
            🐨
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Our Mission</span>
            <h3 className="text-base font-extrabold text-white">We built JobForge AI because the job search is broken</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              As job seekers, we found ourselves writing the exact same summaries, tailoring skill lines manually for keywords, and copy-pasting answers into endless forms. So we decided to build an AI matchmaking engine that handles the boring stuff, letting you focus on interviews.
            </p>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-white">Frequently asked questions</h2>
            <p className="text-xs text-gray-500 mt-1">Everything you need to know about plans, limits, and guarantees.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="border border-white/5 rounded-2xl bg-[#0c0d19]/60 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left text-xs font-bold text-white hover:bg-white/3 transition outline-none cursor-pointer"
                >
                  <span>{f.q}</span>
                  <span className="text-purple-400 font-extrabold text-sm transition">
                    {openFaqIndex === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === idx && (
                  <div className="px-6 pb-4 pt-1 text-xs text-gray-400 leading-relaxed border-t border-white/3 bg-[#0a0b18]/40">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-r from-[#0c0d19] to-[#12132e] border border-purple-500/20 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 rounded-full bg-purple-500 opacity-10 blur-3xl pointer-events-none" />

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight max-w-xl mx-auto">
            Stop tweaking. Start getting interviews.
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => handleUpgrade('Pro')}
              className="px-6 py-3 bg-[#10b981] hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 active:scale-98 cursor-pointer"
            >
              Get Started Now
            </button>
            <Link
              href="#pricing"
              className="text-xs font-bold text-gray-400 hover:text-white transition"
            >
              See Pricing Details
            </Link>
          </div>
          <p className="text-[10px] text-gray-500">No credit card required to try the Free Plan.</p>
        </div>

      </div>

    </div>
  );
}
