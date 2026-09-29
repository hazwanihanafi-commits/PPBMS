import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  ClipboardCheck,
  MessageCircle,
  Building2,
  AlertTriangle,
  Clock,
  FolderOpen,
} from "lucide-react";

import { completeOrientation } from "../api";

/* =========================================================
   PKTAAB POSTGRADUATE ORIENTATION
   =========================================================
   CONTENT IS STORED HERE SO IT IS EASY TO EDIT.

   12 MODULES
   01 — Know Us
   02 — PPBMS
   03 — PPBMS System Introduction
   04 — Postgraduate Handbook
   05 — Research Environment
   06 — Research Milestones
   07 — Research Ethics & Academic Integrity
   08 — Campus & Student Facilities
   09 — AduSiswa
   10 — Where to Find Us
   11 — Student Community / PKTAABSA
   12 — Forms & Documents
   ========================================================= */


/* =========================================================
   MODULE CONTENT
   ========================================================= */

const MODULES = [
  /* =======================================================
     01 — KNOW US
     ======================================================= */

  {
    id: 1,
    number: "01",
    title: "KNOW US",
    subtitle: "PKTAAB & Our People",
    icon: Users,
    color: "purple",

    description:
      "Start your postgraduate journey by getting to know PKTAAB, the Division of Academic & International, our people and the research environment around you.",

    resources: [
  {
    label: "PKTAAB Official Website",
    url:
      "https://www.amdi.usm.my/",
    icon: ExternalLink,
  },
  {
    label: "PKTAAB Corporate Video",
    url:
      "https://drive.google.com/file/d/1xTKmbp6MQ226BuPIdVrgDkjK3sg2z6cl/view?usp=sharing",
    icon: Video,
  },
  {
    label: "Sains @ Bertam Orientation Tour",
    url:
      "https://www.youtube.com/watch?v=d6pvBAYmpus",
    icon: PlayCircle,
  },
  {
    label: "Meet the Team",
    url:
      "https://youtu.be/Q4ZFzwZpEX4",
    icon: Users,
  },
],

    sections: [
      {
        heading: "Welcome to PKTAAB",
        text:
          "Pusat Kanser Tun Abdullah Ahmad Badawi (PKTAAB), Universiti Sains Malaysia (USM), brings together education, research, clinical services and innovation in a multidisciplinary environment.",
      },
      {
        heading: "Division of Academic & International",
        text:
          "The Division of Academic & International supports postgraduate academic administration, student progress monitoring, academic matters, international engagement and postgraduate development.",
      },
      {
        heading: "Meet the People Around You",
        text:
          "Know who to contact when you need help. Your postgraduate journey involves your supervisor, programme team, Division of Academic & International, research teams and relevant support units.",
      },
    ],

    checklist: [
      "Watch the PKTAAB Corporate Video",
      "Watch the Sains @ Bertam Orientation Tour",
      "Review the PKTAAB / Meet the Team information",
      "Identify the person or unit to contact for academic assistance",
    ],
  },


  /* =======================================================
     02 — PPBMS
     ======================================================= */

  {
    id: 2,
    number: "02",
    title: "PPBMS",
    subtitle: "Your Postgraduate Progress System",
    icon: ClipboardCheck,
    color: "gold",

    description:
      "PPBMS is your postgraduate progress monitoring system. Use it to keep track of your academic milestones, submissions and research progress.",

    resources: [
      {
        label: "PPBMS Student Portal",
        url:
          "https://ppbms-frontend.onrender.com/",
        icon: ExternalLink,
      },
      {
        label: "PPBMS Step-by-Step Video",
        url:
          "https://www.youtube.com/watch?v=G2PEIBcbHCY",
        icon: PlayCircle,
      },
    ],

    sections: [
      {
        heading: "Use Your Official USM Email",
        text:
          "Your PPBMS account is linked to your official USM student email. Use the same account when accessing PPBMS and the PKTAAB Orientation SIM.",
      },
      {
        heading: "Your PPBMS Journey",
        text:
          "Use PPBMS to review your student profile, submit required documents, monitor milestones and keep your postgraduate progress up to date.",
      },
    ],

    steps: [
      "Login using your official USM student email.",
      "Review your student profile and academic information.",
      "Complete required submissions and documents.",
      "Monitor your research milestones.",
      "Check PPBMS regularly for announcements, deadlines and required actions.",
    ],

    checklist: [
      "Open the PPBMS Student Portal",
      "Watch the PPBMS Step-by-Step Video",
      "Confirm that your profile information is correct",
      "Understand where to submit postgraduate documents",
      "Know where to check your progress and milestones",
    ],
  },


  /* =======================================================
     03 — SYSTEM INTRODUCTION
     ======================================================= */

  {
    id: 3,
    number: "03",
    title: "SYSTEM INTRODUCTION",
    subtitle: "PPBMS System Introduction Session",
    icon: GraduationCap,
    color: "blue",

    description:
      "Take a guided tour of the PPBMS system before you begin using it independently.",

    resources: [
      {
        label: "PPBMS System Introduction Session",
        url:
          "https://gamma.app/docs/SYSTEM-INTRODUCTION-SESSION-omuigv8ps5cn31j",
        icon: BookOpen,
      },
      {
        label: "PPBMS Student Portal",
        url:
          "https://ppbms-frontend.onrender.com/",
        icon: ExternalLink,
      },
    ],

    sections: [
      {
        heading: "What You Should Learn",
        text:
          "Understand how PPBMS is organised, where to find your academic information, how submissions work and how your postgraduate milestones are monitored.",
      },
      {
        heading: "Your Responsibility",
        text:
          "PPBMS is a monitoring and communication tool. You remain responsible for checking your progress, responding to requests and submitting required documents within the required timeline.",
      },
    ],

    checklist: [
      "Open the PPBMS System Introduction Session",
      "Review the main PPBMS functions",
      "Identify where your milestones are displayed",
      "Identify where documents are submitted",
      "Know how to check announcements and required actions",
    ],
  },


  /* =======================================================
     04 — HANDBOOK
     ======================================================= */

  {
    id: 4,
    number: "04",
    title: "READ THIS FIRST",
    subtitle: "Postgraduate Handbook",
    icon: BookOpen,
    color: "purple",

    description:
      "The Postgraduate Student Handbook is one of your most important references throughout your postgraduate journey.",

    resources: [
      {
        label: "25 Academic Home",
        url:
          "https://academic.amdi.usm.my/academic25",
        icon: FolderOpen,
      },
      {
        label: "PPBMS Student Portal",
        url:
          "https://ppbms-frontend.onrender.com/",
        icon: ExternalLink,
      },
    ],

    sections: [
      {
        heading:
          "2026 Postgraduate Student Handbook — Research Mode",
        text:
          "Use the handbook as your reference for programme requirements, candidature, research progress, academic regulations, thesis examination, viva voce and other postgraduate matters.",
      },
      {
        heading: "Pay Particular Attention To",
        text:
          "Programme requirements, research milestones, progress reporting, TRX500 requirements, thesis preparation, thesis examination, viva voce, academic integrity and relevant USM postgraduate regulations.",
      },
      {
        heading: "Do Not Wait Until You Have a Problem",
        text:
          "The handbook is most useful when you consult it before making important decisions. If you are unsure, discuss the matter with your supervisor or the Division of Academic & International.",
      },
    ],

    checklist: [
      "Locate the postgraduate handbook",
      "Review your programme requirements",
      "Review research progress requirements",
      "Review thesis and viva requirements",
      "Know where to obtain updated postgraduate information",
    ],
  },


  /* =======================================================
     05 — RESEARCH ENVIRONMENT
     ======================================================= */

  {
    id: 5,
    number: "05",
    title: "KNOW YOUR RESEARCH ENVIRONMENT",
    subtitle: "Departments & Research Areas",
    icon: Building2,
    color: "teal",

    description:
      "Understand where your research fits within PKTAAB and identify the department, research area and people relevant to your postgraduate work.",

    resources: [
      {
        label: "PKTAAB Departments & Research Areas",
        url:
          "https://www.amdi.usm.my/departments",
        icon: Building2,
      },
      {
        label: "25 Academic Home",
        url:
          "https://academic.amdi.usm.my/academic25",
        icon: FolderOpen,
      },
    ],

    sections: [
      {
        heading: "Explore Your Department",
        text:
          "Review the departments and research areas available at PKTAAB. Identify where your research topic fits within the wider academic and research environment.",
      },
      {
        heading: "Know Your Research Community",
        text:
          "Understand the research expertise around you. This can help you identify relevant facilities, researchers, collaborators and academic support.",
      },
      {
        heading: "Your Research Identity",
        text:
          "Be able to explain your programme, research field, research topic and how your work contributes to your broader research area.",
      },
    ],

    checklist: [
      "Open the PKTAAB Departments page",
      "Identify your department or research area",
      "Review related research activities",
      "Identify relevant research expertise or facilities",
      "Discuss your research direction with your supervisor",
    ],
  },


  /* =======================================================
     06 — RESEARCH MILESTONES
     ======================================================= */

  {
    id: 6,
    number: "06",
    title: "KNOW YOUR RESEARCH MILESTONES",
    subtitle: "Plan • Monitor • Complete",
    icon: Clock,
    color: "gold",

    description:
      "A successful postgraduate journey requires more than doing good research. You also need to understand your academic milestones and complete them on time.",

    resources: [
      {
        label: "PPBMS Student Portal",
        url:
          "https://ppbms-frontend.onrender.com/",
        icon: ExternalLink,
      },
      {
        label: "25 Academic Home",
        url:
          "https://academic.amdi.usm.my/academic25",
        icon: FolderOpen,
      },
    ],

    milestones: [
      {
        title: "Development Plan",
        text:
          "Establish your research direction, academic goals and development needs.",
      },
      {
        title: "Year Plan / Gantt Chart",
        text:
          "Plan your research activities, milestones, outputs and target dates.",
      },
      {
        title: "Progress Monitoring",
        text:
          "Keep your research progress updated and communicate regularly with your supervisor.",
      },
      {
        title: "Annual Review",
        text:
          "Complete the required annual progress and academic review activities.",
      },
      {
        title: "Thesis & Examination",
        text:
          "Prepare your thesis, complete the required submission process and prepare for examination and viva voce.",
      },
    ],

    checklist: [
      "Review your research timeline",
      "Know your expected postgraduate milestones",
      "Understand the role of PPBMS in progress monitoring",
      "Discuss your timeline with your supervisor",
      "Do not wait until a deadline is near before taking action",
    ],
  },


  /* =======================================================
     07 — RESEARCH ETHICS
     ======================================================= */

  {
    id: 7,
    number: "07",
    title: "RESEARCH ETHICS",
    subtitle: "Do's & Don'ts During Your Research Journey",
    icon: ShieldCheck,
    color: "red",

    description:
      "Good research is not only about getting results. It is about conducting research responsibly, ethically and with integrity.",

    resources: [
      {
        label: "IPS Postgraduate Guidelines",
        url:
          "https://ips.usm.my/index.php/muat-turun/garis-panduan",
        icon: BookOpen,
      },
      {
        label: "USM Code of Good Practice",
        url:
          "https://ips.usm.my/index.php/download/others",
        icon: ShieldCheck,
      },
    ],

    ethicsPoster: true,

    dos: [
      "Obtain the required ethical approval before starting research that requires approval.",
      "Keep your raw data, consent documents, laboratory records and research files properly organised.",
      "Protect participant confidentiality and personal information.",
      "Follow the approved research protocol.",
      "Acknowledge and cite other people's work properly.",
      "Communicate regularly with your supervisor.",
      "Keep track of your research milestones and deadlines.",
      "Discuss major methodological changes with your supervisor before implementation.",
      "Maintain appropriate backups of important research data.",
      "Ask for help early when you encounter a problem.",
    ],

    donts: [
      "Do not start participant recruitment or data collection before the required ethical approval.",
      "Do not fabricate, falsify or manipulate research data.",
      "Do not plagiarise text, ideas, figures, tables or other work.",
      "Do not submit the same manuscript to multiple journals simultaneously.",
      "Do not publish in predatory or questionable journals.",
      "Do not ignore your research timeline or important deadlines.",
      "Do not disappear from your supervisor when your research is delayed.",
      "Do not store important research data only on one personal device.",
      "Do not make major changes to your research protocol without appropriate discussion and approval.",
      "Do not wait until the final stage of your candidature to resolve documentation or milestone problems.",
    ],

    warning:
      "When you are unsure, stop and ask. Your supervisor and the relevant academic or research unit should be consulted before you make decisions that may affect research ethics, participants, data or academic requirements.",
  },


  /* =======================================================
     08 — CAMPUS
     ======================================================= */

  {
    id: 8,
    number: "08",
    title: "KNOW YOUR CAMPUS",
    subtitle: "Student Facilities & Getting Around",
    icon: MapPin,
    color: "blue",

    description:
      "Get familiar with the campus, facilities, transportation and important locations you may need during your postgraduate journey.",

    resources: [
      {
        label: "Shuttle Bus Schedule",
        url:
          "https://reachapps.amdi.usm.my/tripschedule/",
        icon: MapPin,
      },
      {
        label: "PKTAAB / Bertam Location",
        url:
          "https://maps.app.goo.gl/x3FjXC69WCryEbV77?g_st=ic",
        icon: MapPin,
      },
      {
        label: "PKTAAB Official Website",
        url:
          "https://www.amdi.usm.my/",
        icon: FolderOpen,
      },
    ],

    sections: [
      {
        heading: "Transportation",
        text:
          "Check the shuttle schedule before travelling between campus locations. Plan your journey around teaching, research, meetings and administrative appointments.",
      },
      {
        heading: "Campus Facilities",
        text:
          "Explore the facilities available to postgraduate students and identify where you can obtain academic, research and student support.",
      },
      {
        heading: "Be Campus-Ready",
        text:
          "Save important locations and contact information on your phone so you can find them quickly when needed.",
      },
    ],

    checklist: [
      "Open the shuttle bus schedule",
      "Save the PKTAAB location in your maps",
      "Identify important student facilities",
      "Know where to seek academic assistance",
      "Know where to seek administrative assistance",
    ],
  },


  /* =======================================================
     09 — ADUSISWA
     ======================================================= */

  {
    id: 9,
    number: "09",
    title: "ADUSISWA",
    subtitle: "Your USM Student System",
    icon: GraduationCap,
    color: "purple",

    description:
      "AduSiswa is part of your wider USM student experience. Make sure you know where to access official student-related information and services.",

    resources: [
      {
        label: "AduSiswa Student System",
        url:
          "https://healthservice.amdi.usm.my/gramsv2/home.php?view=dash",
        icon: FolderOpen,
      },
      {
        label: "USM Official Website",
        url:
          "https://www.usm.my/",
        icon: ExternalLink,
      },
    ],

    sections: [
      {
        heading: "Your USM Student Information",
        text:
          "Use official USM student systems and services to manage student-related information and access services available to you.",
      },
      {
        heading: "Use Official Sources",
        text:
          "Always use official USM or PKTAAB links when accessing student services. Avoid relying on outdated links shared in old documents or messages.",
      },
      {
        heading: "Keep Your Information Updated",
        text:
          "Make sure your student information and contact details are kept up to date where required.",
      },
    ],

    checklist: [
      "Know what AduSiswa is used for",
      "Access the official USM student information system",
      "Check your student information",
      "Know where to obtain help if you encounter a system problem",
    ],
  },


  /* =======================================================
     10 — WHERE TO FIND US
     ======================================================= */

  {
    id: 10,
    number: "10",
    title: "KNOW WHERE TO FIND US",
    subtitle: "Location, Contacts & Support",
    icon: MapPin,
    color: "teal",

    description:
      "Knowing where to go and who to contact can save you time when you need academic, administrative or research assistance.",

    resources: [
      {
        label: "PKTAAB Location",
        url:
          "https://maps.app.goo.gl/x3FjXC69WCryEbV77?g_st=ic",
        icon: MapPin,
      },
      {
        label: "PKTAAB Departments",
        url:
          "https://www.amdi.usm.my/departments",
        icon: Building2,
      },
      {
        label: "Academic Contact & Directory",
        url:
          "https://academic.amdi.usm.my/25acadabout/contactus25",
        icon: FolderOpen,
      },
    ],

    sections: [
      {
        heading: "Division of Academic & International",
        text:
          "For postgraduate academic and administrative matters, contact the Division of Academic & International through the official channels provided to you.",
      },
      {
        heading: "Your Supervisor",
        text:
          "Your supervisor is your primary academic and research guide. Maintain regular communication and discuss your progress, research decisions and challenges.",
      },
      {
        heading: "Know Before You Ask",
        text:
          "Before contacting a unit, check PPBMS, the handbook and the official resources page. You may find the answer immediately.",
      },
    ],

    checklist: [
      "Save the PKTAAB location",
      "Know how to contact the Division of Academic & International",
      "Know your supervisor's contact details",
      "Bookmark the official resources page",
    ],
  },


  /* =======================================================
     11 — PKTAAB STUDENTS ASSOCIATION
     ======================================================= */

  {
    id: 11,
    number: "11",
    title: "JOIN THE STUDENT COMMUNITY",
    subtitle: "PKTAAB Students Association & Communication",
    icon: MessageCircle,
    color: "green",

    description:
      "Your postgraduate journey is not only about research and academic milestones. Connect with fellow students, stay informed and become part of the PKTAAB student community.",

    resources: [
      {
        label:
          "PKTAAB Students Association — WhatsApp Community",
        url:
          "https://chat.whatsapp.com/H9m8mW0Mv2V6x5CxoSZS42",
        icon: MessageCircle,
      },
      {
        label:
          "Postgraduate Student Community — WhatsApp",
        url:
          "https://chat.whatsapp.com/B5ZaFOBac71C7fvJaHmwnz",
        icon: Users,
      },
      {
        label:
          "Academic & International — Email",
        url:
          "mailto:anissyamimi@usm.my",
        icon: ExternalLink,
      },
    ],

    communityCard: {
      title:
        "PKTAAB Students Association",
      acronym:
        "PKTAABSA",

      description:
        "A student-led community for PKTAAB students to foster unity, communication, collaboration and student-led activities.",

      members:
        "Student Community",

      groups:
        "2 groups",
    },

    sections: [
      {
        heading:
          "PKTAAB Students Association",
        text:
          "PKTAAB Students Association (PKTAABSA) provides a student community where students can connect with one another, share information and participate in student-led activities.",
      },
      {
        heading:
          "From Students, For Students",
        text:
          "The student community is intended to support synergy, unity and seamless communication among students across programmes and cohorts.",
      },
      {
        heading:
          "Stay Connected",
        text:
          "Join the official student community so that you can stay connected with your peers and participate in relevant student activities, announcements and initiatives.",
      },
    ],

    communityGuidelines: [
      "Introduce yourself and connect with fellow postgraduate students.",
      "Use the community for constructive student-to-student communication.",
      "Share useful information and opportunities relevant to students.",
      "Respect students from different programmes, backgrounds and cultures.",
      "Do not share confidential research, participant or personal information.",
      "Use official academic channels for formal academic or administrative matters.",
    ],

    checklist: [
      "Join the PKTAAB Students Association WhatsApp Community",
      "Open and review the available community groups",
      "Know how to access student announcements",
      "Connect with fellow postgraduate students",
      "Know the difference between student-community communication and official academic communication",
    ],
  },


  /* =======================================================
     12 — FORMS & DOCUMENTS
     ======================================================= */

  {
    id: 12,
    number: "12",
    title: "KNOW WHERE TO FIND YOUR FORMS",
    subtitle: "Forms, Documents & Resources",
    icon: FileText,
    color: "gold",

    description:
      "You should never have to search randomly for postgraduate forms. Save this page — it is one of your key resource points.",

    resources: [
      {
        label:
          "Academic Forms & Downloads",
        url:
          "https://academic.amdi.usm.my/acdm-svc/academicdw",
        icon: FolderOpen,
      },
      {
        label:
          "25 Academic Home",
        url:
          "https://academic.amdi.usm.my/academic25",
        icon: BookOpen,
      },
      {
        label:
          "PPBMS Student Portal",
        url:
          "https://ppbms-frontend.onrender.com/",
        icon: ExternalLink,
      },
    ],

    formCategories: [
      {
        title:
          "Admission & Registration",

        items: [
          "Confirmation of Registration — Master / PhD Research Mode",
          "Admission and registration-related documents",
        ],
      },

      {
        title:
          "Candidature",

        items: [
          "HEP 03 and candidature-related forms",
          "Supervisor change",
          "Thesis title / research-related changes",
          "Extension and candidature matters",
        ],
      },

      {
        title:
          "Thesis & Examination",

        items: [
          "Thesis submission documents",
          "Draft thesis submission",
          "Final thesis submission",
          "Examination-related documents",
        ],
      },

      {
        title:
          "Postgraduate Guidelines",

        items: [
          "USM postgraduate handbook",
          "Research postgraduate guidelines",
          "Code of Good Practice for Postgraduate Research Studies",
          "Academic calendar and related information",
        ],
      },
    ],

    sections: [
      {
        heading:
          "One Important Bookmark",
        text:
          "Save the Academic Forms & Downloads page in your browser. It is the main place to check for postgraduate forms, documents and resources.",
      },
      {
        heading:
          "Use the Latest Version",
        text:
          "Before submitting a form, always check the official website for the latest version and current submission instructions.",
      },
    ],

    checklist: [
      "Open the Academic Forms & Downloads page",
      "Bookmark the page",
      "Locate candidature-related forms",
      "Locate thesis submission documents",
      "Locate postgraduate guidelines",
      "Use the latest version of every form",
    ],
  },
];


/* =========================================================
   HELPER
   ========================================================= */

function openResource(url) {
  if (!url) return;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function Orientation({
  token,
  student,
  onCompleted,
  initialModule = 1,
}) {
  const [currentModule, setCurrentModule] =
    useState(initialModule);

  const [completedModules, setCompletedModules] =
    useState([]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const module =
    MODULES.find(
      (item) =>
        item.id === currentModule
    );

  const progress = useMemo(() => {
    return Math.round(
      (completedModules.length /
        MODULES.length) *
        100
    );
  }, [completedModules]);

  const isCurrentCompleted =
    completedModules.includes(
      currentModule
    );

  const studentName =
    student?.studentName ||
    student?.["Student Name"] ||
    student?.name ||
    student?.email?.split("@")[0] ||
    "Student";

  const matric =
    student?.matric ||
    student?.["Matric"] ||
    student?.matricNo ||
    student?.["Matric No."] ||
    "";

  const programme =
    student?.programme ||
    student?.["Programme"] ||
    "";

  /* -------------------------------------------------------
     COMPLETE CURRENT MODULE
     ------------------------------------------------------- */

  function markModuleComplete() {
    if (
      !completedModules.includes(
        currentModule
      )
    ) {
      setCompletedModules(
        (prev) => [
          ...prev,
          currentModule,
        ]
      );
    }
  }

  /* -------------------------------------------------------
     NEXT MODULE
     ------------------------------------------------------- */

  function nextModule() {
    markModuleComplete();

    if (
      currentModule <
      MODULES.length
    ) {
      setCurrentModule(
        (prev) => prev + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* -------------------------------------------------------
     PREVIOUS MODULE
     ------------------------------------------------------- */

  function previousModule() {
    if (
      currentModule > 1
    ) {
      setCurrentModule(
        (prev) => prev - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* -------------------------------------------------------
     FINISH ORIENTATION
     ------------------------------------------------------- */

  async function finishOrientation() {
    setError("");
    setSaving(true);

    try {
      const allModules =
        MODULES.map(
          (item) => item.id
        );

      setCompletedModules(
        allModules
      );

      await completeOrientation(
        token,
        {
          progress: 100,

          version:
            "2026.1",

          modulesCompleted:
            allModules,

          studentName,

          matric,

          programme,
        }
      );

      if (onCompleted) {
        onCompleted({
          progress: 100,

          completedAt:
            new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to save orientation completion."
      );
    } finally {
      setSaving(false);
    }
  }


  if (!module) {
    return null;
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="orientation-shell">

      {/* ===================================================
          TOP HEADER
          =================================================== */}

      <header className="orientation-topbar">

        <div className="orientation-brand">

          <div className="orientation-brand-mark">
            USM
          </div>

          <div>
            <div className="orientation-brand-title">
              PKTAAB
            </div>

            <div className="orientation-brand-subtitle">
              Postgraduate Student Orientation
            </div>
          </div>

        </div>


        <div className="orientation-student">

          <span>
            Welcome
          </span>

          <strong>
            {studentName}
          </strong>

        </div>

      </header>


      {/* ===================================================
          HERO
          =================================================== */}

      <section className="orientation-hero">

        <div className="orientation-hero-inner">

          <div className="orientation-eyebrow">

            <Sparkles size={15} />

            YOUR PKTAAB POSTGRADUATE JOURNEY

          </div>


          <h1>
            Welcome to your
            <br />

            <span>
              PKTAAB Universe.
            </span>
          </h1>


          <p>
            Explore the people, systems,
            research environment, milestones
            and resources you need to begin
            your postgraduate journey with
            confidence.
          </p>


          <div className="orientation-progress-card">

            <div className="progress-top">

              <span>
                Orientation Progress
              </span>

              <strong>
                {completedModules.length}
                /
                {MODULES.length}
              </strong>

            </div>


            <div className="progress-track">

              <div
                className="progress-fill"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>


            <div className="progress-caption">

              {progress === 100
                ? "Orientation completed"
                : `${progress}% completed`}

            </div>

          </div>

        </div>

      </section>


      {/* ===================================================
          MODULE NAVIGATION
          =================================================== */}

      <section className="orientation-navigation">

        <div className="module-strip">

          {MODULES.map(
            (item) => {

              const Icon =
                item.icon;

              const completed =
                completedModules.includes(
                  item.id
                );

              const active =
                item.id ===
                currentModule;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    `module-pill ${
                      active
                        ? "active"
                        : ""
                    } ${
                      completed
                        ? "completed"
                        : ""
                    }`
                  }
                  onClick={() => {

                    setCurrentModule(
                      item.id
                    );

                    window.scrollTo({
                      top: 0,
                      behavior:
                        "smooth",
                    });

                  }}
                >

                  <span className="module-pill-number">

                    {completed ? (
                      <Check size={13} />
                    ) : (
                      item.number
                    )}

                  </span>


                  <span className="module-pill-title">

                    {item.title}

                  </span>

                </button>
              );
            }
          )}

        </div>

      </section>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="orientation-main">


        {/* MODULE HEADER */}

        <div className="orientation-module-header">

          <div
            className={
              `module-icon-large ${module.color}`
            }
          >
            <module.icon size={30} />
          </div>


          <div>

            <div className="module-number-label">
              MODULE {module.number}
            </div>

            <h2>
              {module.title}
            </h2>

            <div className="module-subtitle">
              {module.subtitle}
            </div>

          </div>


          {isCurrentCompleted && (

            <div className="module-completed-badge">

              <CheckCircle2 size={18} />

              Completed

            </div>

          )}

        </div>


        <p className="module-description">
          {module.description}
        </p>


        {/* =================================================
            RESOURCES
            ================================================= */}

        {module.resources?.length >
          0 && (

          <section className="resource-section">

            <div className="section-heading">

              <div className="section-heading-icon">

                <ExternalLink
                  size={18}
                />

              </div>

              <div>

                <h3>
                  Start Here
                </h3>

                <p>
                  Open these official
                  resources before
                  continuing.
                </p>

              </div>

            </div>


            <div className="resource-grid">

              {module.resources.map(
                (
                  resource,
                  index
                ) => {

                  const ResourceIcon =
                    resource.icon ||
                    ExternalLink;

                  return (

                    <button
                      type="button"
                      className="resource-card"
                      key={
                        `${resource.label}-${index}`
                      }
                      onClick={() =>
                        openResource(
                          resource.url
                        )
                      }
                    >

                      <div className="resource-icon">

                        <ResourceIcon
                          size={22}
                        />

                      </div>


                      <div className="resource-content">

                        <strong>
                          {resource.label}
                        </strong>

                        <span>

                          Open resource

                          <ExternalLink
                            size={13}
                          />

                        </span>

                      </div>

                    </button>

                  );
                }
              )}

            </div>

          </section>

        )}


        {/* =================================================
            MODULE 11 — STUDENT COMMUNITY CARD
            ================================================= */}

        {module.communityCard && (

          <section className="student-community-card">

            <div className="community-card-top">

              <div className="community-logo-placeholder">

                <MessageCircle
                  size={34}
                />

              </div>


              <div className="community-card-title">

                <div className="community-kicker">

                  PKTAAB STUDENT COMMUNITY

                </div>


                <h2>
                  {module.communityCard.title}
                </h2>


                <div className="community-acronym">

                  {module.communityCard.acronym}

                </div>

              </div>

            </div>


            <p className="community-description">

              {module.communityCard.description}

            </p>


            <div className="community-stats">

              <div className="community-stat">

                <Users size={20} />

                <div>

                  <strong>
                    {module.communityCard.members}
                  </strong>

                  <span>
                    Community
                  </span>

                </div>

              </div>


              <div className="community-stat">

                <MessageCircle
                  size={20}
                />

                <div>

                  <strong>
                    {module.communityCard.groups}
                  </strong>

                  <span>
                    Available groups
                  </span>

                </div>

              </div>

            </div>


            <button
              type="button"
              className="community-join-button"
              onClick={() =>
                openResource(
                  "https://chat.whatsapp.com/H9m8mW0Mv2V6x5CxoSZS42"
                )
              }
            >

              <MessageCircle
                size={20}
              />

              Join PKTAAB Students Association

              <ExternalLink
                size={16}
              />

            </button>

          </section>

        )}


        {/* =================================================
            MODULE 11 — COMMUNITY GUIDELINES
            ================================================= */}

        {module.communityGuidelines?.length >
          0 && (

          <section className="content-section">

            <div className="section-heading">

              <div className="section-heading-icon">

                <Users size={18} />

              </div>


              <div>

                <h3>
                  Be Part of the Community
                </h3>

                <p>
                  A few simple guidelines
                  for a positive student
                  community.
                </p>

              </div>

            </div>


            <div className="community-guidelines">

              {module.communityGuidelines.map(
                (
                  item,
                  index
                ) => (

                  <div
                    className="community-guideline"
                    key={item}
                  >

                    <div className="guideline-number">

                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}

                    </div>


                    <div className="guideline-check">

                      <Check
                        size={14}
                      />

                    </div>


                    <span>
                      {item}
                    </span>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        {/* =================================================
            NORMAL INFORMATION SECTIONS
            ================================================= */}

        {module.sections?.length >
          0 && (

          <section className="content-section">

            {module.sections.map(
              (
                section,
                index
              ) => (

                <article
                  className="info-card"
                  key={
                    `${section.heading}-${index}`
                  }
                >

                  <div className="info-card-number">

                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}

                  </div>


                  <div>

                    <h3>
                      {section.heading}
                    </h3>

                    <p>
                      {section.text}
                    </p>

                  </div>

                </article>

              )
            )}

          </section>

        )}


        {/* =================================================
            STEPS
            ================================================= */}

        {module.steps?.length >
          0 && (

          <section className="content-section">

            <div className="section-heading">

              <div className="section-heading-icon">

                <ArrowRight
                  size={18}
                />

              </div>


              <div>

                <h3>
                  Your PPBMS Journey
                </h3>

                <p>
                  Follow these steps.
                </p>

              </div>

            </div>


            <div className="step-list">

              {module.steps.map(
                (
                  step,
                  index
                ) => (

                  <div
                    className="step-row"
                    key={step}
                  >

                    <div className="step-number">

                      {index + 1}

                    </div>


                    <div className="step-text">

                      {step}

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        {/* =================================================
            MILESTONES
            ================================================= */}

        {module.milestones?.length >
          0 && (

          <section className="content-section">

            <div className="milestone-grid">

              {module.milestones.map(
                (
                  milestone,
                  index
                ) => (

                  <article
                    className="milestone-card"
                    key={
                      milestone.title
                    }
                  >

                    <div className="milestone-number">

                      {index + 1}

                    </div>


                    <div>

                      <h3>
                        {milestone.title}
                      </h3>

                      <p>
                        {milestone.text}
                      </p>

                    </div>

                  </article>

                )
              )}

            </div>

          </section>

        )}


        {/* =================================================
            MODULE 07 — RESEARCH ETHICS POSTER
            ================================================= */}

        {module.ethicsPoster && (

          <section className="ethics-poster">

            <div className="ethics-poster-header">

              <div className="ethics-shield">

                <ShieldCheck
                  size={34}
                />

              </div>


              <div>

                <div className="ethics-kicker">

                  YOUR RESEARCHER'S CODE

                </div>


                <h2>

                  DO IT RIGHT.
                  <br />

                  <span>
                    RESEARCH WITH INTEGRITY.
                  </span>

                </h2>


                <p>

                  Your research journey
                  is built on ethics,
                  honesty, responsibility
                  and respect.

                </p>

              </div>

            </div>


            <div className="ethics-columns">


              {/* DO */}

              <div className="ethics-column do-column">

                <div className="ethics-column-header">

                  <div className="ethics-symbol">
                    ✓
                  </div>


                  <div>

                    <span>
                      DO
                    </span>

                    <h3>
                      Research Responsibly
                    </h3>

                  </div>

                </div>


                <div className="ethics-list">

                  {module.dos.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="ethics-item"
                        key={
                          `do-${index}`
                        }
                      >

                        <div className="ethics-check">

                          <Check
                            size={15}
                          />

                        </div>


                        <span>
                          {item}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* DON'T */}

              <div className="ethics-column dont-column">

                <div className="ethics-column-header">

                  <div className="ethics-symbol">
                    !
                  </div>


                  <div>

                    <span>
                      DON'T
                    </span>

                    <h3>
                      Avoid Research Pitfalls
                    </h3>

                  </div>

                </div>


                <div className="ethics-list">

                  {module.donts.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="ethics-item"
                        key={
                          `dont-${index}`
                        }
                      >

                        <div className="ethics-cross">
                          ×
                        </div>


                        <span>
                          {item}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>


            <div className="ethics-warning">

              <AlertTriangle
                size={20}
              />

              <div>

                <strong>
                  When in doubt, ask.
                </strong>

                <p>
                  {module.warning}
                </p>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            FORM CATEGORIES — MODULE 12
            ================================================= */}

        {module.formCategories?.length >
          0 && (

          <section className="content-section">

            <div className="section-heading">

              <div className="section-heading-icon">

                <FolderOpen
                  size={18}
                />

              </div>


              <div>

                <h3>
                  Your Form Finder
                </h3>

                <p>
                  Use the official Academic
                  Resources page for the
                  latest documents.
                </p>

              </div>

            </div>


            <div className="form-category-grid">

              {module.formCategories.map(
                (
                  category
                ) => (

                  <article
                    className="form-category-card"
                    key={
                      category.title
                    }
                  >

                    <div className="form-category-icon">

                      <FileText
                        size={20}
                      />

                    </div>


                    <h3>
                      {category.title}
                    </h3>


                    <ul>

                      {category.items.map(
                        (
                          item
                        ) => (

                          <li
                            key={item}
                          >

                            <Check
                              size={14}
                            />

                            <span>
                              {item}
                            </span>

                          </li>

                        )
                      )}

                    </ul>

                  </article>

                )
              )}

            </div>

          </section>

        )}


        {/* =================================================
            CHECKLIST
            ================================================= */}

        {module.checklist?.length >
          0 && (

          <section className="checklist-section">

            <div className="checklist-header">

              <div className="checklist-icon">

                <ClipboardCheck
                  size={21}
                />

              </div>


              <div>

                <h3>
                  Before You Continue
                </h3>

                <p>
                  Make sure you have completed
                  these orientation actions.
                </p>

              </div>

            </div>


            <div className="checklist-items">

              {module.checklist.map(
                (
                  item
                ) => (

                  <label
                    className="checklist-item"
                    key={item}
                  >

                    <input
                      type="checkbox"
                    />


                    <span className="custom-checkbox">

                      <Check
                        size={13}
                      />

                    </span>


                    <span>
                      {item}
                    </span>

                  </label>

                )
              )}

            </div>

          </section>

        )}


        {/* =================================================
            MODULE ACTION
            ================================================= */}

        <section className="module-action">

          <div>

            <div className="module-action-kicker">

              MODULE {module.number}
              {" "}OF{" "}
              {MODULES.length}

            </div>


            <h3>

              {currentModule ===
              MODULES.length
                ? "Ready to complete your orientation?"
                : "Completed this module?"}

            </h3>


            <p>

              {currentModule ===
              MODULES.length
                ? "Submit your orientation completion to finish the PKTAAB onboarding journey."
                : "Mark this module as completed and continue to the next part of your journey."}

            </p>

          </div>


          <div className="module-action-buttons">

            {currentModule > 1 && (

              <button
                type="button"
                className="btn-secondary"
                onClick={
                  previousModule
                }
              >

                <ArrowLeft
                  size={17}
                />

                Previous

              </button>

            )}


            {currentModule <
            MODULES.length ? (

              <button
                type="button"
                className="btn-primary"
                onClick={
                  nextModule
                }
              >

                Complete & Continue

                <ArrowRight
                  size={17}
                />

              </button>

            ) : (

              <button
                type="button"
                className="btn-complete"
                onClick={
                  finishOrientation
                }
                disabled={
                  saving
                }
              >

                {saving ? (

                  "Saving..."

                ) : (

                  <>
                    <CheckCircle2
                      size={18}
                    />

                    Complete Orientation
                  </>

                )}

              </button>

            )}

          </div>

        </section>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (

          <div className="orientation-error">

            <AlertTriangle
              size={18}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="orientation-footer">

          <div className="footer-brand">

            <div className="footer-usm">
              USM
            </div>


            <div>

              <strong>
                Division of Academic & International
              </strong>

              <span>

                Pusat Kanser Tun Abdullah Ahmad Badawi
                <br />

                Universiti Sains Malaysia

              </span>

            </div>

          </div>


          <div className="footer-note">

            <ShieldCheck
              size={15}
            />

            Official postgraduate
            orientation resource

          </div>

        </footer>

      </main>

    </div>
  );
}
