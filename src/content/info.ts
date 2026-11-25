// Guest information pages: policies, about, contact, FAQ (Michael Stead's
// review 11-25; MDP: "go with Michael's suggestion"). Facts come from the
// company policies Laurice gave 10-19 (the ops Knowledge Hub), the rental
// agreement, Hospitable Direct's checkout (cancellation, read 11-25) and
// Michael's Truvi wording. Change a policy here and in the rental agreement.
import { CANCELLATION } from "@/lib/cancellation";
import { SITE, STATS } from "@/lib/site";

export type Block = string | { list: string[] } | { h: string };
export type InfoPage = {
  slug: string;
  title: string;
  description: string;
  updated: string;
  intro?: string;
  sections: { heading?: string; body: Block[] }[];
};

const phone = SITE.phone.display;
const email = SITE.email;
const UPDATED = "November 25, 2026";

export const INFO_PAGES: InfoPage[] = [
  {
    slug: "about",
    title: "About us",
    description: `${SITE.name} is a local team hosting design-forward stays in Edmonton, Canmore and Calgary since ${STATS.since}.`,
    updated: UPDATED,
    intro: `We're a local Alberta team that has hosted guests since ${STATS.since}: ${STATS.stays.toLocaleString("en-CA")} stays and counting, rated ${STATS.airbnb.rating} from ${STATS.airbnb.reviews.toLocaleString("en-CA")} Airbnb reviews and ${STATS.google.rating} from ${STATS.google.reviews.toLocaleString("en-CA")} Google reviews (as of ${STATS.asOf}).`,
    sections: [
      {
        heading: "Who we are",
        body: [
          `${SITE.name} is the guest side of ${SITE.legalName}, an Edmonton company started by Michael and Katrina. We design, furnish, clean and look after every home on this site ourselves, with our own teams in Edmonton, Canmore and Calgary.`,
          `If you own a property and want it managed, that's our other site: [piqueproperties.com](${SITE.ownerSite}).`,
        ],
      },
      {
        heading: "What you can expect",
        body: [
          {
            list: [
              "A home that matches its photos, professionally cleaned before every stay.",
              "Live prices and availability from our own calendar, with the full price shown before checkout.",
              `A real local team you can call or text at ${phone}, before and during your stay.`,
              "If something isn't right when you arrive, tell us right away and we'll fix it.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact us",
    description: `Call, text or email the ${SITE.name} team.`,
    updated: UPDATED,
    sections: [
      {
        body: [
          {
            list: [
              `Call or text: [${phone}](tel:${SITE.phone.e164})`,
              `Email: [${email}](mailto:${email})`,
            ],
          },
          "Staying with us? Message us the way you booked (your booking confirmation has the details) or call or text the number above. For anything urgent during your stay, call.",
          "Questions before you book? Ask Pique, the chat at the bottom of every page, can find homes, check dates and show prices. It hands you to the team for anything else.",
          `Own a home you'd like us to manage? Visit [piqueproperties.com](${SITE.ownerSite}).`,
        ],
      },
    ],
  },
  {
    slug: "cancellation",
    title: "Cancellation and refunds",
    description: "When you can cancel a direct booking and how much comes back.",
    updated: UPDATED,
    intro: "This is the policy for bookings made on this site. The exact dates for your stay are shown at checkout before you pay. Bookings made on Airbnb, Vrbo or Booking.com follow that platform's policy.",
    sections: [
      {
        heading: "If you cancel",
        body: [
          {
            list: [
              `Up to ${CANCELLATION.fullDays} days before check-in: full refund of what you paid.`,
              `Within ${CANCELLATION.graceHours} hours of booking: full refund, as long as check-in is more than ${CANCELLATION.halfDays} days away.`,
              `Up to ${CANCELLATION.halfDays} days before check-in: 50% of the nightly rate, fees and taxes back.`,
              `Less than ${CANCELLATION.halfDays} days before check-in: no refund.`,
            ],
          },
          "To cancel, message us or call or text " + phone + ". Refunds go back to the card you paid with.",
        ],
      },
      {
        heading: "If we have to cancel",
        body: [
          "If we ever can't host you (for example a serious repair), we'll offer you a comparable home for the same dates or a full refund, your choice.",
        ],
      },
      {
        heading: "During your stay",
        body: [
          "Leaving early isn't refunded. If something in the home isn't as described, tell us right away so we can fix it or move you.",
          "A stay ended for breaking the house rules (parties, extra guests, smoking) isn't refunded.",
        ],
      },
    ],
  },
  {
    slug: "house-rules",
    title: "House rules",
    description: "The rules every guest agrees to in the rental agreement.",
    updated: UPDATED,
    intro: "You'll agree to these in a short rental agreement before your check-in instructions are sent. Some homes add their own rules (hot tub hours, parking); those are on the home's page.",
    sections: [
      {
        heading: "Check-in and check-out",
        body: [
          {
            list: [
              "Check-in from 4 PM. Check-out by 10 AM in Edmonton and Calgary, 11 AM in Canmore.",
              "Early check-in can be requested, never guaranteed: 2 PM $20, noon $40, 10 AM $60, plus tax. We can't hold luggage before check-in.",
              "Late check-out: there's a 30-minute grace period, then a $50 fee. More than 2 hours late is charged as an extra night.",
            ],
          },
        ],
      },
      {
        heading: "Guests",
        body: [
          {
            list: [
              "Only the guests on the booking may stay, up to the home's maximum. Every guest must be on the booking.",
              "Extra guests beyond the number included in the price are $15 per person per night plus tax, already shown in your total when you book.",
              "No parties or events.",
              "Quiet hours are 10 PM to 7 AM.",
            ],
          },
        ],
      },
      {
        heading: "Smoking",
        body: ["No smoking or vaping of any kind inside our homes. Evidence of smoking is a $500 fee plus tax."],
      },
      {
        heading: "Before you arrive",
        body: [
          "Every guest who books verifies their ID and signs our rental agreement before the check-in instructions and door code are sent.",
        ],
      },
      {
        heading: "Hot tubs",
        body: [
          "Hot tub hours and rules are on each home's page. Soap, bubble bath, oils, glass or food in the tub means a full drain and clean, charged at $500 plus tax.",
        ],
      },
      {
        heading: "Lost and found",
        body: ["Tell us right away if you've left something behind. Picking it up and shipping it to you is a $100 handling fee plus shipping."],
      },
      {
        heading: "Taxes",
        body: ["Every fee is plus 11% tax: 5% GST and the 6% Alberta Tourism Levy."],
      },
    ],
  },
  {
    slug: "damage-protection",
    title: "Damage protection",
    description: "Every direct booking includes damage protection through Truvi. No deposit.",
    updated: UPDATED,
    sections: [
      {
        body: [
          "There's no security deposit and no separate damage waiver. Every stay is enrolled in damage protection through our partner Truvi, included in the cost of your stay, which covers up to $700 of accidental damage.",
          "Truvi also handles the ID verification you'll complete before check-in.",
          "You're still responsible for damage beyond that cover, damage that isn't accidental, and fees under the house rules (for example smoking or a hot tub drain). Please tell us about any damage right away; an honest accident reported promptly is always easier to sort out.",
        ],
      },
    ],
  },
  {
    slug: "pets",
    title: "Pets",
    description: "Which homes take pets, and the pet fee.",
    updated: UPDATED,
    sections: [
      {
        body: [
          {
            list: [
              "Pets are welcome only in homes marked Pet friendly, and must be added to the booking (choose Pets when you search).",
              "Pet fee: $30 per night, capped at $150 per week and $300 per month, plus tax.",
              "Service animals are always welcome; let us know when you book.",
            ],
          },
          "A pet in a home that isn't pet friendly, or one not on the booking, is a breach of the house rules.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Booking terms",
    description: "The terms for booking a stay on this site.",
    updated: UPDATED,
    intro: `These terms apply to stays booked on this site with ${SITE.legalName} ("we"). When you book, you also sign our rental agreement, which has the full terms.`,
    sections: [
      {
        heading: "Your booking",
        body: [
          "Prices come live from our booking system. The total shown before checkout includes every fee and tax; nothing is added later.",
          "Some homes are request to book: we confirm your dates before the stay is booked. Payment is taken by Stripe through our booking system (Hospitable).",
          "The person who books must be the person staying, and must verify their ID and sign the rental agreement before check-in instructions are sent.",
        ],
      },
      {
        heading: "Policies that apply",
        body: [
          {
            list: [
              "[Cancellation and refunds](/cancellation)",
              "[House rules](/house-rules)",
              "[Damage protection](/damage-protection)",
              "[Pets](/pets)",
              "[Privacy](/privacy)",
            ],
          },
        ],
      },
      {
        heading: "Your stay",
        body: [
          "We'll let you know before anyone enters the home during your stay, except in an emergency.",
          "Breaking the house rules (parties, extra guests, smoking, pets where they aren't allowed) can end your stay without a refund.",
          `Questions about these terms: ${email} or ${phone}.`,
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    description: "What we collect when you book or browse, why, and your choices.",
    updated: UPDATED,
    intro: `${SITE.legalName} follows Alberta's Personal Information Protection Act (PIPA) and Canada's PIPEDA. This policy covers this website and stays booked on it.`,
    sections: [
      {
        heading: "What we collect",
        body: [
          {
            list: [
              "When you book: your name, email, phone, the guests on the booking and your dates. Card details go straight to Stripe; we never see the full number.",
              "Before check-in: ID verification through Truvi and your signed rental agreement.",
              "When you use Ask Pique, the chat: what you write and its answers, plus the page you were on. Don't share card numbers or ID in the chat.",
              "If you accept cookies: how you use the site (pages, device, rough location, how you arrived). See [Cookies](/cookies).",
            ],
          },
        ],
      },
      {
        heading: "Why",
        body: [
          "To take and run your booking, verify who's staying, look after you during your stay, answer questions, improve the site and the chat, and meet our legal and tax obligations. We don't sell your information.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Only service providers that help us run stays, under contracts that require them to protect it:",
          {
            list: [
              "Hospitable (booking system) and Stripe (payments).",
              "Truvi (ID verification and damage protection).",
              "Vercel (hosts this site) and Supabase (stores chat records, in Canada).",
              "Anthropic (powers Ask Pique).",
              "Google, Meta and HighLevel (analytics and ad measurement), only if you accept cookies.",
            ],
          },
          "Some of these store information outside Canada, mainly in the United States, where it may be accessible to authorities under local law.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Booking records are kept as long as tax law requires. Chat conversations are kept to improve our answers; ask and we'll delete yours.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          `You can ask to see, correct or delete your information, or withdraw consent, by emailing ${email}. You can change your cookie choice any time with Cookie settings at the bottom of every page. If you're not satisfied with our answer, you can contact the Office of the Information and Privacy Commissioner of Alberta.`,
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookies",
    description: "The cookies this site uses and how to change your choice.",
    updated: UPDATED,
    sections: [
      {
        body: [
          "When you first visit we ask before turning anything on. If you decline, the site still works fully; only the cookie that remembers your choice is kept, in your browser.",
          "If you accept, we load Google Tag Manager, which runs Google Analytics (how the site is used) and our ad measurement tools (Google, Meta and HighLevel), so we can see what's working and which ads bring bookings.",
          "Change your mind any time with Cookie settings at the bottom of every page.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    description: "How we make this site and our stays easier to use.",
    updated: UPDATED,
    sections: [
      {
        body: [
          "We build this site to the WCAG 2.1 AA standard: it works with a keyboard and screen readers, text has strong contrast, and every page reads without JavaScript.",
          "Our homes vary. Many are houses with stairs, and basement suites are reached by stairs. If you need step-free access, a ground-floor bedroom or anything else, call or text us before you book and we'll tell you honestly which homes fit.",
          `If any part of the site is hard to use, tell us at ${email} or ${phone} and we'll fix it.`,
        ],
      },
    ],
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    description: "Booking direct, prices, check-in, pets and more.",
    updated: UPDATED,
    sections: [
      { heading: "Why book direct?", body: ["Same homes, same team, straight from our own calendar: live prices, no platform service fee, and you deal with us directly from booking to check-out."] },
      { heading: "Is the price final?", body: ["Yes. The total before checkout includes cleaning, any extra-guest or pet fees, discounts and 11% tax (GST and Alberta Tourism Levy). Nothing is added later."] },
      { heading: "Is my payment secure?", body: ["Payment is handled by Stripe through our booking system; we never see your full card number."] },
      { heading: "What happens after I book?", body: ["You'll get a confirmation, then a link to verify your ID and sign a short rental agreement. Once both are done, we send check-in instructions and your door code before arrival."] },
      { heading: "What are check-in and check-out times?", body: ["Check-in from 4 PM. Check-out by 10 AM in Edmonton and Calgary, 11 AM in Canmore. Early check-in can be requested (fees from $20); see [House rules](/house-rules)."] },
      { heading: "Can I cancel?", body: [`Free cancellation up to ${CANCELLATION.fullDays} days before check-in, and 50% back up to ${CANCELLATION.halfDays} days before. See [Cancellation and refunds](/cancellation).`] },
      { heading: "Is there a security deposit?", body: ["No. Every stay includes damage protection through Truvi. See [Damage protection](/damage-protection)."] },
      { heading: "Can I bring my pet?", body: ["In homes marked Pet friendly, for $30 per night plus tax. See [Pets](/pets)."] },
      { heading: "Do you have cribs?", body: ["Yes, pack 'n plays are free. Add an infant when you book and we'll have one ready."] },
      { heading: "Can I have a party?", body: ["No parties or events in any of our homes."] },
      { heading: "Who do I contact during my stay?", body: [`Call or text ${phone}, any time for anything urgent.`] },
    ],
  },
];

export const INFO_BY_SLUG = new Map(INFO_PAGES.map((p) => [p.slug, p]));
