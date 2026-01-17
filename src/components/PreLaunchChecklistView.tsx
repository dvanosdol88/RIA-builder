import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock, CheckCircle2, Circle } from 'lucide-react';
import * as firebaseService from '../services/firebaseService';
import type { ChecklistStatus } from '../services/firebaseService';

// ============================================
// 3-STATE TOGGLE COMPONENT
// ============================================

interface ThreeStateToggleProps {
  status: ChecklistStatus;
  onChange: (status: ChecklistStatus) => void;
  disabled?: boolean;
}

function ThreeStateToggle({
  status,
  onChange,
  disabled = false,
}: ThreeStateToggleProps) {
  const statusColors = {
    not_started: 'bg-red-500',
    in_progress: 'bg-yellow-500',
    complete: 'bg-green-500',
  };

  const statusPositions = {
    not_started: 'left-0.5',
    in_progress: 'left-1/2 -translate-x-1/2',
    complete: 'right-0.5',
  };

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    complete: 'Complete',
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const third = width / 3;

    if (x < third) {
      onChange('not_started');
    } else if (x < third * 2) {
      onChange('in_progress');
    } else {
      onChange('complete');
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        onClick={handleDrag}
        className={`relative w-16 h-6 bg-gray-200 rounded-full cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
        }`}
        title={statusLabels[status]}
      >
        {/* Track segments */}
        <div className="absolute inset-0 flex rounded-full overflow-hidden">
          <div className="flex-1 bg-red-100 border-r border-gray-300" />
          <div className="flex-1 bg-yellow-100 border-r border-gray-300" />
          <div className="flex-1 bg-green-100" />
        </div>

        {/* Slider thumb */}
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${statusColors[status]} ${statusPositions[status]}`}
        />
      </div>
      <span
        className={`text-[10px] font-medium ${
          status === 'not_started'
            ? 'text-red-600'
            : status === 'in_progress'
              ? 'text-yellow-600'
              : 'text-green-600'
        }`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}

// ============================================
// CHECKLIST DATA STRUCTURE
// ============================================

interface ChecklistItem {
  id: string;
  text: string;
  timeframe: string;
  dependencies?: string;
  details?: string;
}

interface ChecklistPage {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
}

export const CHECKLIST_PAGES: ChecklistPage[] = [
  {
    id: 'registration-legal',
    name: 'Registration & Legal',
    description: 'Establish the legal foundation for your RIA practice',
    items: [
      {
        id: 'entity-formation',
        text: 'Entity formation (LLC/Corp)',
        timeframe: 'Week 1-2',
        details:
          'Form LLC or corporation in your state. Consider single-member LLC for solo practice.',
      },
      {
        id: 'ein-application',
        text: 'Apply for EIN from IRS',
        timeframe: 'Week 1-2',
        dependencies: 'Entity formation',
        details:
          'Free online application at IRS.gov. Required for bank accounts and filings.',
      },
      {
        id: 'state-sec-decision',
        text: 'State vs SEC registration decision',
        timeframe: 'Week 2-3',
        details:
          'Under $100M AUM = state registration. Flat-fee model with ~500 clients likely qualifies for state.',
      },
      {
        id: 'adv-part1-prep',
        text: 'Form ADV Part 1 preparation',
        timeframe: 'Week 3-6',
        dependencies: 'State/SEC decision',
        details:
          'Filed through IARD system. Discloses business practices, fees, disciplinary history.',
      },
      {
        id: 'adv-part2-brochure',
        text: 'Form ADV Part 2 (Client Brochure)',
        timeframe: 'Week 3-6',
        dependencies: 'ADV Part 1',
        details:
          'Plain-English disclosure document for clients. Must be delivered before or at contract signing.',
      },
      {
        id: 'eo-insurance',
        text: 'E&O/Professional Liability Insurance',
        timeframe: 'Week 4-6',
        details:
          'Typical coverage: $1M per occurrence. Shop multiple carriers. Required by most states.',
      },
      {
        id: 'iard-registration',
        text: 'IARD account setup and filing',
        timeframe: 'Week 5-8',
        dependencies: 'ADV preparation',
        details:
          'Investment Adviser Registration Depository. State registration fees vary ($100-$600).',
      },
      {
        id: 'state-notice-filing',
        text: 'State notice filings (if multi-state)',
        timeframe: 'Week 6-8',
        dependencies: 'IARD registration',
        details:
          'Required if advising clients in multiple states. Additional fees per state.',
      },
    ],
  },
  {
    id: 'technology-setup',
    name: 'Technology Setup',
    description: 'Configure the technology stack for client service delivery',
    items: [
      {
        id: 'crm-wealthbox',
        text: 'CRM setup (Wealthbox)',
        timeframe: 'Week 3-4',
        details:
          'Configure workflows, custom fields, tags. Import contacts. Set up integrations.',
      },
      {
        id: 'planning-rightcapital',
        text: 'Planning software (RightCapital)',
        timeframe: 'Week 3-4',
        details:
          'Configure planning assumptions, branding, client portal settings.',
      },
      {
        id: 'aggregation-plaid',
        text: 'Account aggregation (Plaid integration)',
        timeframe: 'Week 4-5',
        dependencies: 'Planning software',
        details:
          'Connect Plaid for automatic account linking. Test with multiple institution types.',
      },
      {
        id: 'manual-upload-flow',
        text: 'Manual statement upload workflow',
        timeframe: 'Week 4-5',
        details:
          'Design fallback process for institutions not supported by Plaid.',
      },
      {
        id: 'email-archiving',
        text: 'WORM-compliant email archiving',
        timeframe: 'Week 4-6',
        details:
          'Required by SEC/state regulations. Options: Smarsh, Global Relay, or built-in Microsoft 365.',
      },
      {
        id: 'website-deployment',
        text: 'Website deployment',
        timeframe: 'Week 5-7',
        details:
          'Ensure ADV-compliant disclosures, clear fee information, required regulatory disclaimers.',
      },
      {
        id: 'fee-calculator',
        text: 'Fee calculator deployment and testing',
        timeframe: 'Week 6-8',
        dependencies: 'Website deployment',
        details:
          'Transparent $100/month flat fee calculator. Test edge cases and mobile responsiveness.',
      },
      {
        id: 'client-portal',
        text: 'Client portal configuration',
        timeframe: 'Week 5-7',
        dependencies: 'Planning software',
        details:
          'RightCapital client portal setup. Test document sharing, task assignment.',
      },
      {
        id: 'calendar-scheduling',
        text: 'Calendar and scheduling tool',
        timeframe: 'Week 4-5',
        details:
          'Calendly or built-in CRM scheduling. Configure meeting types, buffers, availability.',
      },
      {
        id: 'video-conferencing',
        text: 'Video conferencing setup',
        timeframe: 'Week 3-4',
        details:
          'Zoom or Google Meet. Test screen sharing, recording for compliance.',
      },
    ],
  },
  {
    id: 'compliance-infrastructure',
    name: 'Compliance Infrastructure',
    description: 'Build the compliance framework required for RIA operations',
    items: [
      {
        id: 'policies-procedures',
        text: 'Written Policies & Procedures Manual',
        timeframe: 'Week 4-7',
        details:
          'Required by Rule 206(4)-7. Cover trading, custody, privacy, advertising, etc.',
      },
      {
        id: 'code-of-ethics',
        text: 'Code of Ethics',
        timeframe: 'Week 4-6',
        details:
          'Required by Rule 204A-1. Personal trading policies, gift rules, confidentiality.',
      },
      {
        id: 'privacy-policy',
        text: 'Privacy Policy (Reg S-P)',
        timeframe: 'Week 4-6',
        details:
          'Initial and annual privacy notices. Document information sharing practices.',
      },
      {
        id: 'advertising-review',
        text: 'Advertising Review Process',
        timeframe: 'Week 5-7',
        details:
          'Document approval process for all marketing. Maintain advertising file.',
      },
      {
        id: 'client-agreement',
        text: 'Client Advisory Agreement Template',
        timeframe: 'Week 4-6',
        dependencies: 'ADV Part 2',
        details:
          'Define scope of services, fees ($100/month), termination, fiduciary duty.',
      },
      {
        id: 'aml-procedures',
        text: 'AML/KYC Procedures',
        timeframe: 'Week 5-7',
        details:
          'Client identification, suspicious activity monitoring. Required for non-custodial advisors too.',
      },
      {
        id: 'business-continuity',
        text: 'Business Continuity Plan',
        timeframe: 'Week 6-8',
        details:
          'Document backup systems, succession planning, disaster recovery procedures.',
      },
      {
        id: 'cybersecurity-policy',
        text: 'Cybersecurity Policy',
        timeframe: 'Week 5-7',
        details:
          'Required by many states. Password policies, data encryption, incident response.',
      },
      {
        id: 'books-records',
        text: 'Books and Records Procedures',
        timeframe: 'Week 5-7',
        details:
          'Rule 204-2 compliance. Document retention schedule (5-6 years minimum).',
      },
    ],
  },
  {
    id: 'marketing-preparation',
    name: 'Marketing Preparation',
    description: 'Prepare compliant marketing materials and channels',
    items: [
      {
        id: 'brand-identity',
        text: 'Brand identity finalization',
        timeframe: 'Week 2-4',
        details:
          'Logo, colors, fonts. Ensure professional but approachable for target audience.',
      },
      {
        id: 'website-live',
        text: 'Website go-live with compliance review',
        timeframe: 'Week 7-9',
        dependencies: 'Advertising review process',
        details:
          'All pages reviewed for compliance. ADV brochure accessible. Fee transparency.',
      },
      {
        id: 'calculator-tested',
        text: 'Fee calculator tested and deployed',
        timeframe: 'Week 8-10',
        dependencies: 'Website live',
        details:
          'Test all scenarios. Clear $100/month messaging. No hidden fee implications.',
      },
      {
        id: 'postcard-campaign',
        text: 'Postcard campaign designed and printed',
        timeframe: 'Week 8-10',
        details:
          'Compliance-reviewed. Target geographic area. Track response codes.',
      },
      {
        id: 'social-linkedin',
        text: 'LinkedIn profile optimized',
        timeframe: 'Week 6-8',
        details:
          'Professional photo, clear value proposition, link to website.',
      },
      {
        id: 'social-profiles',
        text: 'Social media profiles created',
        timeframe: 'Week 6-8',
        details: 'Archive and document all posts. Avoid performance claims.',
      },
      {
        id: 'content-calendar',
        text: 'Initial content calendar (90 days)',
        timeframe: 'Week 8-10',
        details:
          'Educational content aligned with target audience. Pre-approved topics.',
      },
      {
        id: 'referral-strategy',
        text: 'Referral strategy documented',
        timeframe: 'Week 9-11',
        details:
          'No cash referral fees without disclosure. Thank-you process for referrers.',
      },
    ],
  },
  {
    id: 'go-live-readiness',
    name: 'Go-Live Readiness',
    description: 'Final checks and soft launch preparation',
    items: [
      {
        id: 'test-client',
        text: 'Test client walkthrough (end-to-end)',
        timeframe: 'Week 10-11',
        dependencies: 'All technology setup',
        details:
          'Complete full client journey: onboarding, aggregation, first meeting, plan delivery.',
      },
      {
        id: 'error-handling',
        text: 'Error handling protocols documented',
        timeframe: 'Week 10-11',
        details:
          'What happens when Plaid fails? Manual upload process. Client communication templates.',
      },
      {
        id: 'soft-launch-criteria',
        text: 'Soft launch criteria defined',
        timeframe: 'Week 10-11',
        details:
          'Identify 3-5 beta clients. Friends/family or warm contacts. Gather feedback.',
      },
      {
        id: 'soft-launch-execution',
        text: 'Soft launch with beta clients',
        timeframe: 'Week 11-12',
        dependencies: 'Test client walkthrough',
        details:
          'Onboard beta clients. Document friction points. Iterate on process.',
      },
      {
        id: 'day1-checklist',
        text: 'Day 1 operational checklist',
        timeframe: 'Week 12',
        details:
          'Morning routine, system checks, response time goals, escalation procedures.',
      },
      {
        id: 'support-procedures',
        text: 'Client support procedures',
        timeframe: 'Week 11-12',
        details:
          'How to handle questions, complaints, urgent requests. Response time SLAs.',
      },
      {
        id: 'ai-assistant-trained',
        text: 'AI assistant prompts and guardrails',
        timeframe: 'Week 10-12',
        details:
          'Document AI usage policies. Human review requirements. Disclosure to clients.',
      },
      {
        id: 'launch-announcement',
        text: 'Launch announcement prepared',
        timeframe: 'Week 12',
        dependencies: 'Soft launch execution',
        details:
          'Email to network, social posts, press release if appropriate.',
      },
      {
        id: 'week1-goals',
        text: 'Week 1 success metrics defined',
        timeframe: 'Week 12',
        details:
          'Number of inquiries, consultations booked, clients onboarded. Realistic expectations.',
      },
      {
        id: 'backup-plans',
        text: 'Backup plans for common failures',
        timeframe: 'Week 11-12',
        details:
          'Plaid outage, scheduling conflicts, document signing failures. Workarounds documented.',
      },
    ],
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function PreLaunchChecklistView() {
  const [activePage, setActivePage] = useState<string>(CHECKLIST_PAGES[0].id);
  const [checklistStates, setChecklistStates] = useState<
    Record<string, ChecklistStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Load checklist states from Firebase
  useEffect(() => {
    async function loadStates() {
      try {
        const states = await firebaseService.getChecklistStates();
        setChecklistStates(states);
      } catch (error) {
        console.error('Failed to load checklist states:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStates();
  }, []);

  // Handle status change
  const handleStatusChange = async (
    itemId: string,
    newStatus: ChecklistStatus
  ) => {
    // Optimistic update
    setChecklistStates((prev) => ({ ...prev, [itemId]: newStatus }));
    setIsSaving(itemId);

    try {
      await firebaseService.saveChecklistItemState(itemId, newStatus);
    } catch (error) {
      console.error('Failed to save checklist state:', error);
      // Rollback on error
      setChecklistStates((prev) => {
        const { [itemId]: removedItem, ...rest } = prev;
        void removedItem;
        return rest;
      });
    } finally {
      setIsSaving(null);
    }
  };

  // Get current page data
  const currentPage =
    CHECKLIST_PAGES.find((p) => p.id === activePage) || CHECKLIST_PAGES[0];

  // Calculate progress for a page
  const getPageProgress = (pageId: string) => {
    const page = CHECKLIST_PAGES.find((p) => p.id === pageId);
    if (!page) return { complete: 0, inProgress: 0, total: 0 };

    const complete = page.items.filter(
      (item) => checklistStates[item.id] === 'complete'
    ).length;
    const inProgress = page.items.filter(
      (item) => checklistStates[item.id] === 'in_progress'
    ).length;
    return { complete, inProgress, total: page.items.length };
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const allItems = CHECKLIST_PAGES.flatMap((p) => p.items);
    const complete = allItems.filter(
      (item) => checklistStates[item.id] === 'complete'
    ).length;
    const inProgress = allItems.filter(
      (item) => checklistStates[item.id] === 'in_progress'
    ).length;
    return { complete, inProgress, total: allItems.length };
  };

  const overall = getOverallProgress();

  return (
    <div className="flex h-full overflow-hidden gap-4">
      {/* Left sidebar - Page navigation */}
      <div className="w-52 bg-white border-r border-gray-200 overflow-y-auto no-scrollbar overflow-x-hidden pr-2">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-900">
            Pre-Launch Checklist
          </h2>
          <p className="text-xs text-gray-500 mt-1">Day 0-90 Execution Plan</p>

          {/* Overall progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>
                {Math.round((overall.complete / overall.total) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${(overall.complete / overall.total) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{overall.complete} complete</span>
              <span>{overall.inProgress} in progress</span>
              <span>
                {overall.total - overall.complete - overall.inProgress}{' '}
                remaining
              </span>
            </div>
          </div>
        </div>

        {/* Page navigation */}
        <div className="p-2">
          {CHECKLIST_PAGES.map((page, index) => {
            const progress = getPageProgress(page.id);
            const isActive = activePage === page.id;

            return (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}
                  >
                    {page.name}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{
                      width: `${(progress.complete / progress.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {progress.complete > 0 && (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> {progress.complete}
                    </span>
                  )}
                  {progress.inProgress > 0 && (
                    <span className="text-[10px] text-yellow-600 flex items-center gap-0.5">
                      <Clock size={10} /> {progress.inProgress}
                    </span>
                  )}
                  {progress.total - progress.complete - progress.inProgress >
                    0 && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Circle size={10} />{' '}
                      {progress.total - progress.complete - progress.inProgress}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                {CHECKLIST_PAGES.findIndex((p) => p.id === activePage) + 1}
              </span>
              {currentPage.name}
            </h1>
            <p className="text-gray-500 text-sm mt-2 ml-11">
              {currentPage.description}
            </p>
          </div>

          {/* Checklist items */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading checklist...
              </div>
            ) : (
              currentPage.items.map((item) => {
                const status = checklistStates[item.id] || 'not_started';
                const isSavingThis = isSaving === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border shadow-sm p-4 transition-all ${
                      status === 'complete'
                        ? 'border-green-200 bg-green-50/30'
                        : status === 'in_progress'
                          ? 'border-yellow-200 bg-yellow-50/30'
                          : 'border-gray-200'
                    } ${isSavingThis ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* 3-state toggle */}
                      <div className="flex-shrink-0 pt-1">
                        <ThreeStateToggle
                          status={status}
                          onChange={(newStatus) =>
                            handleStatusChange(item.id, newStatus)
                          }
                          disabled={isSavingThis}
                        />
                      </div>

                      {/* Item content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3
                            className={`font-medium ${
                              status === 'complete'
                                ? 'text-green-700 line-through'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.text}
                          </h3>
                          <div className="flex-shrink-0 text-right">
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              <Clock size={12} />
                              {item.timeframe}
                            </span>
                          </div>
                        </div>

                        {item.dependencies && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                            <ChevronRight size={12} />
                            <span>Depends on: {item.dependencies}</span>
                          </div>
                        )}

                        {item.details && (
                          <p className="mt-2 text-sm text-gray-500">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Page navigation */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => {
                const currentIndex = CHECKLIST_PAGES.findIndex(
                  (p) => p.id === activePage
                );
                if (currentIndex > 0) {
                  setActivePage(CHECKLIST_PAGES[currentIndex - 1].id);
                }
              }}
              disabled={
                CHECKLIST_PAGES.findIndex((p) => p.id === activePage) === 0
              }
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Page
            </button>
            <button
              onClick={() => {
                const currentIndex = CHECKLIST_PAGES.findIndex(
                  (p) => p.id === activePage
                );
                if (currentIndex < CHECKLIST_PAGES.length - 1) {
                  setActivePage(CHECKLIST_PAGES[currentIndex + 1].id);
                }
              }}
              disabled={
                CHECKLIST_PAGES.findIndex((p) => p.id === activePage) ===
                CHECKLIST_PAGES.length - 1
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
