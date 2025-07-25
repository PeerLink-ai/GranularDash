"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How do I connect a new AI agent?",
    answer:
      'Navigate to the "Agent Management" page, click on "Connect New Agent", and fill in the required API details and endpoint URL for your external AI service.',
  },
  {
    question: "Where can I view past policy violations?",
    answer:
      'All recorded policy violations can be found under the "Audit Logs" section, or a summarized view is available on the main "AI Governance Dashboard".',
  },
  {
    question: "How often are compliance reports generated?",
    answer:
      'Compliance reports are generated automatically on a quarterly basis. Ad-hoc reports can also be requested from the "Compliance Reports" page.',
  },
  {
    question: "What should I do if an incident is detected?",
    answer:
      'Upon detection, incidents are logged in the "Incident Response" dashboard. You can view details there and initiate resolution procedures.',
  },
  {
    question: "Can I customize access rules for specific users?",
    answer:
      'Yes, granular access rules can be configured on the "Access Control" page, allowing you to define permissions for different users and roles.',
  },
]

export function FAQSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
