export const THESIS_GUIDELINES = [
  {
    id: "ch1",
    number: "01",
    title: "Chapter 1: Introduction",
    description:
      "Guidelines for preparing the introduction and defining the research problem.",
    requirements: "Problem Statement",
    wordCount: "1,500 - 2,000 words",
    dueLabel: "Week 2",
    match: [/chapter\s*1/i, /introduction/i],
    bullets: [
      "State the research problem clearly and concisely.",
      "Explain why the topic matters academically and practically.",
      "Outline objectives, research questions, and scope.",
      "Keep the chapter within the recommended word count.",
    ],
  },
  {
    id: "ch2",
    number: "02",
    title: "Chapter 2: Literature Review",
    description:
      "How to structure related work, identify gaps, and cite sources correctly.",
    requirements: "Literature Matrix",
    wordCount: "3,000 - 4,000 words",
    dueLabel: "Week 5",
    match: [/chapter\s*2/i, /literature/i],
    bullets: [
      "Summarize key theories and prior studies relevant to your topic.",
      "Use a literature matrix to compare methods and findings.",
      "Highlight research gaps your work will address.",
      "Cite all sources consistently (APA or department style).",
    ],
  },
  {
    id: "ch3",
    number: "03",
    title: "Chapter 3: Methodology",
    description:
      "Requirements for research design, sampling, and data collection methods.",
    requirements: "Research Design",
    wordCount: "2,000 - 2,500 words",
    dueLabel: "Week 8",
    match: [/chapter\s*3/i, /method/i],
    bullets: [
      "Describe your research design and justify the approach.",
      "Explain sampling, instruments, and data collection steps.",
      "Cover ethics, validity, and reliability considerations.",
      "Include a clear plan for analysis.",
    ],
  },
  {
    id: "ch4",
    number: "04",
    title: "Chapter 4: Results & Discussion",
    description:
      "How to present findings, interpret results, and discuss implications.",
    requirements: "Findings Report",
    wordCount: "2,500 - 3,500 words",
    dueLabel: "Week 11",
    match: [/chapter\s*4/i, /result/i, /discussion/i],
    bullets: [
      "Present results with clear tables or figures where needed.",
      "Interpret findings against your research questions.",
      "Discuss limitations and implications honestly.",
      "Link discussion back to the literature review.",
    ],
  },
  {
    id: "ch5",
    number: "05",
    title: "Chapter 5: Conclusion",
    description:
      "Final chapter checklist covering summary, contributions, and future work.",
    requirements: "Closing Summary",
    wordCount: "1,000 - 1,500 words",
    dueLabel: "Week 13",
    match: [/chapter\s*5/i, /conclusion/i],
    bullets: [
      "Restate objectives and summarize key findings.",
      "State academic and practical contributions.",
      "Recommend future research directions.",
      "Ensure references and appendices are complete.",
    ],
  },
];
