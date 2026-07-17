import type { Story } from "@/types";

/** DEMO SEED DATA — fictional editorial stories, labelled as demo in the UI. */
export const DEMO_STORIES: Story[] = [
  {
    id: "st-0001",
    slug: "simba-waits-every-evening",
    title: "He Used to Run From Us. Now Simba Waits Every Evening.",
    excerpt:
      "For two years, Simba was a tan blur disappearing behind the Technology Market stalls. One injured paw changed everything — for him, and for us.",
    category: "rescue",
    animalSlug: "simba",
    readMinutes: 5,
    publishedAt: "2026-05-20",
    author: "KGP PAWS",
    heroPalette: ["#C97F45", "#173F35"],
    featured: true,
    demo: true,
    photos: [],
    blocks: [
      {
        type: "p",
        text: "Every volunteer who works the Technology Market feeding round knew Simba — or rather, knew of him. He was the dog who was always almost there: a flick of a tan tail behind the tea stall, a shape at the edge of the streetlight that dissolved if you looked at it directly.",
      },
      {
        type: "p",
        text: "For two years, that was the whole relationship. We left food where he would find it. He waited until we left to eat it. It was an arrangement built on mutual respect and a ten-metre minimum distance, and honestly, we thought it would stay that way forever.",
      },
      { type: "h2", text: "The report" },
      {
        type: "p",
        text: "On the evening of 18 April, a student filed a report through the PAWS app: a tan dog near the market, limping badly, holding his front left paw off the ground. The photo attached to the report was unmistakably Simba — closer than any of us had ever managed to get a camera.",
      },
      {
        type: "timeline",
        items: [
          { date: "18 Apr", text: "Report filed: tan dog limping near Technology Market" },
          { date: "18 Apr", text: "Volunteer team located Simba by 8 PM" },
          { date: "19 Apr", text: "Wound cleaned and dressed; antibiotics started" },
          { date: "27 Apr", text: "Final check — fully recovered" },
        ],
      },
      {
        type: "p",
        text: "What happened next surprised everyone. Maybe it was the pain, or maybe two years of dinners had quietly counted for something — but when our volunteer sat down a few metres away and waited, Simba didn't run. He watched her for a long minute. Then he limped over and lay down.",
      },
      {
        type: "quote",
        text: "I had rehearsed a whole plan for how we'd safely restrain him. He just... put his head down and let me look at his paw. Two years of patience, cashed in all at once.",
        by: "Rescue volunteer, KGP PAWS",
      },
      { type: "h2", text: "Nine days" },
      {
        type: "p",
        text: "The injury itself was minor — a deep cut, likely from broken glass, that had begun to get infected. Nine days of cleaning, dressing and antibiotics fixed the paw. But the treatment did something else: it rewrote Simba's entire theory of people.",
      },
      { type: "image", caption: "Simba, week two of recovery — first voluntary approach", palette: ["#E9C98F", "#C97F45"] },
      {
        type: "p",
        text: "He now waits near the market every evening. He greets the feeding team at a full, confident walk. He has learned that hands mostly bring biscuits, and he has opinions about which volunteers carry the good ones.",
      },
      {
        type: "p",
        text: "Simba is vaccinated, sterilized, fully recovered — and available for adoption. He'd suit a calm home with someone who understands that trust, once earned, is permanent. Until that home appears, you can find him at the market around sunset, waiting. Not just for food. Mostly not just for food.",
      },
    ],
  },
  {
    id: "st-0002",
    slug: "mishti-both-eyes-open",
    title: "Mishti Kept One Eye Closed for a Month. Both Are Open Now.",
    excerpt:
      "The quietest cat in VS Hall arrived with the softest meow on campus and a badly infected eye. This is what two months of patience looks like.",
    category: "recovery",
    animalSlug: "mishti",
    readMinutes: 4,
    publishedAt: "2026-06-28",
    author: "KGP PAWS",
    heroPalette: ["#C48A5A", "#7A4A2B"],
    featured: true,
    demo: true,
    photos: [],
    blocks: [
      {
        type: "p",
        text: "The first three students who heard Mishti thought they were imagining it. Her meow is genuinely that quiet — a small, polite sound, like someone clearing their throat before asking a very reasonable question.",
      },
      {
        type: "p",
        text: "The question, in early May, was urgent: she was underweight, and her left eye was swollen shut with infection. A VS Hall resident filed a PAWS report the same evening, and treatment began the next morning.",
      },
      { type: "h2", text: "Small patient, big fight" },
      {
        type: "p",
        text: "Eye infections in young cats can escalate fast, and for the first two weeks it wasn't certain the eye could be saved. Volunteers ran a strict schedule — drops three times a day, feeding support, a warm crate on the hall's ground floor during the worst of it.",
      },
      { type: "image", caption: "Recovery photo: both eyes open, late June", palette: ["#F0DCC8", "#C48A5A"] },
      {
        type: "quote",
        text: "She never once scratched anyone through the whole treatment. She'd just sit there with this enormous dignity, letting us fix her.",
        by: "Foster volunteer, VS Hall",
      },
      {
        type: "p",
        text: "By late June the infection had fully cleared. Both eyes are bright, her weight is healthy, and the meow — unchanged — remains at library volume.",
      },
      {
        type: "p",
        text: "Mishti is now in the final stretch of recovery and would heal fastest in a foster home. She is gentle, quiet, and endlessly patient. If you can offer her a calm corner for a few weeks, she will pay you in chin-scratch privileges and companionable silence.",
      },
    ],
  },
  {
    id: "st-0003",
    slug: "the-dean-of-main-building",
    title: "The Dean of Main Building Has Held Office for Six Years",
    excerpt:
      "Shanti appears in more convocation photos than some faculty. A profile of the campus's most senior civil servant.",
    category: "campus-paw",
    animalSlug: "shanti",
    readMinutes: 3,
    publishedAt: "2026-04-12",
    author: "KGP PAWS",
    heroPalette: ["#6E7570", "#202421"],
    featured: true,
    demo: true,
    photos: [],
    blocks: [
      {
        type: "p",
        text: "Every campus has its institutions. IIT Kharagpur has the Main Building, the Clock, and — for the last six years, stationed at the steps between them — Shanti.",
      },
      {
        type: "p",
        text: "She arrived as a young dog around 2020 and simply decided this was her post. Since then she has supervised thousands of exams (from outside), attended every convocation (uninvited, welcome), and photobombed more graduation portraits than anyone can count.",
      },
      { type: "h2", text: "What a community dog is" },
      {
        type: "p",
        text: "Shanti is what animal welfare workers call a community dog: not a stray in any meaningful sense, but a resident. She has a territory, a routine, and a wide circle of humans who consider her theirs. Removing a dog like Shanti from her home would be a cruelty dressed as kindness.",
      },
      {
        type: "p",
        text: "So PAWS supports her where she is — regular meals, annual vaccination, and now that she's entering her senior years, joint checkups and supplements for the stiffness in her hind legs.",
      },
      { type: "image", caption: "Morning post, Main Building steps", palette: ["#C9CBC4", "#6E7570"] },
      {
        type: "quote",
        text: "Students graduate and leave. Professors retire. Shanti remains. At this point she has more institutional memory than the noticeboard.",
        by: "Volunteer diary, March 2026",
      },
      {
        type: "p",
        text: "If you pass the Main Building steps in the morning, you'll find her at her post. Walk slowly. Say good morning. She has earned it.",
      },
    ],
  },
  {
    id: "st-0004",
    slug: "toffees-first-night-indoors",
    title: "Toffee's First Night Indoors, As Told by Her New Family",
    excerpt:
      "In 2025, a campus puppy went home with a professor's family. Her adopters share what the first week of adoption actually looks like.",
    category: "adoption",
    readMinutes: 4,
    publishedAt: "2026-02-14",
    author: "Guest — adopter family",
    heroPalette: ["#DCC9A3", "#8C6A4F"],
    demo: true,
    photos: [],
    blocks: [
      {
        type: "p",
        text: "We didn't plan to adopt. We planned to attend a departmental dinner. But the PAWS volunteer table had a photo board, and on the photo board was a small brown face labelled 'TOFFEE — will supervise your homework for food', and our daughter stopped walking.",
      },
      { type: "h2", text: "The application" },
      {
        type: "p",
        text: "The adoption process surprised us with its seriousness — a proper application, a conversation about our housing and schedule, a meet-and-greet on neutral ground. We learned later that PAWS declines more applications than it approves. That rigor was, in hindsight, the first sign our dog would come to us healthy and well-assessed.",
      },
      {
        type: "p",
        text: "Toffee came home on a Sunday with a vaccination card, a deworming schedule, and extremely strong opinions about the washing machine.",
      },
      { type: "image", caption: "Night one: the negotiated territory settlement", palette: ["#E7D6BC", "#B08968"] },
      { type: "h2", text: "What we'd tell other adopters" },
      {
        type: "p",
        text: "The first night is loud. The first week is chaos. Somewhere around day ten, the chaos develops a routine, and somewhere around week three you stop remembering what the house felt like without her.",
      },
      {
        type: "quote",
        text: "Campus dogs come pre-installed with resilience. What they're missing is just an address. You can provide an address.",
        by: "Toffee's family",
      },
      {
        type: "p",
        text: "A year on, Toffee sleeps on the exact centre of whatever is most inconvenient, supervises homework as promised, and has never once seen the inside of the washing machine. Some mysteries she prefers to maintain.",
      },
    ],
  },
  {
    id: "st-0005",
    slug: "4-55-am-the-feeding-round",
    title: "4:55 AM: Notes From the Feeding Round",
    excerpt:
      "Thirty kilograms of food, nine stops, one cycle rickshaw, and every dog on the route awake before the alarm. A volunteer diary.",
    category: "volunteer-diary",
    readMinutes: 3,
    publishedAt: "2026-03-08",
    author: "Volunteer diary",
    heroPalette: ["#173F35", "#0E2B23"],
    demo: true,
    photos: [],
    blocks: [
      {
        type: "p",
        text: "The route starts at 4:55 AM, which the dogs know. They know it better than we do. On mornings when a volunteer oversleeps, the dogs at stop one have been known to relocate, judgmentally, toward the hostels.",
      },
      {
        type: "p",
        text: "Nine stops. Thirty kilograms of rice, eggs and kibble, cooked the night before in the volunteer mess corner and loaded onto a cycle rickshaw that has done this route so many times it could probably do it unmanned.",
      },
      { type: "h2", text: "Stop four: the market" },
      {
        type: "p",
        text: "Stop four is Technology Market, which means Simba, which means the ritual: he walks the last fifty metres alongside the rickshaw like an honour guard, accepts his bowl, and then sits facing the road while he eats. Old habits. Someone has to watch the perimeter.",
      },
      { type: "image", caption: "The route, hour one", palette: ["#274F44", "#173F35"] },
      {
        type: "quote",
        text: "People ask if getting up at 4:30 is hard. It is. Then a dog you've fed for three years sees you and her whole body wags, and you'd genuinely do it twice a day.",
      },
      {
        type: "p",
        text: "The round ends at 7 AM, in time for morning classes. The bowls are collected, the rickshaw is parked, and across the campus, forty-odd dogs go back to their actual full-time job: napping in the exact centre of the footpath.",
      },
      {
        type: "p",
        text: "The feeding programme runs 365 days a year and is funded entirely by donations. If you'd like to keep the 4:55 AM rickshaw rolling, the 90 Days of Campus Feeding campaign is the most direct way to help.",
      },
    ],
  },
  {
    id: "st-0006",
    slug: "how-to-say-hello-to-a-campus-dog",
    title: "How to Say Hello to a Campus Dog (The Polite Way)",
    excerpt:
      "Most campus dogs are friendly. All of them appreciate good manners. A short field guide to first introductions.",
    category: "education",
    readMinutes: 4,
    publishedAt: "2026-01-22",
    author: "KGP PAWS",
    heroPalette: ["#B59B77", "#5E432C"],
    demo: true,
    photos: [],
    blocks: [
      {
        type: "p",
        text: "Campus dogs meet hundreds of new humans every semester, and most have developed excellent people skills. The introductions that go wrong usually go wrong on the human side. Here is the etiquette, from the dog's point of view.",
      },
      { type: "h2", text: "1. Let them vote" },
      {
        type: "p",
        text: "Stop a few steps away and let the dog decide whether this is happening. A dog who wants to meet you will come to you — tail loose, body soft, maybe a sniff of your shoe. A dog who stays put has voted no, and the vote is binding.",
      },
      { type: "h2", text: "2. The hand, presented correctly" },
      {
        type: "p",
        text: "Offer a loose, low hand — knuckles first, below their chin height, moving slowly or not at all. Reaching over a dog's head is, in dog etiquette, roughly the equivalent of a stranger ruffling your hair on the metro.",
      },
      { type: "h2", text: "3. Read the ears, not the tail" },
      {
        type: "p",
        text: "A wagging tail means arousal, not always happiness. Relaxed ears and a soft, open mouth are the real green lights. Pinned ears, a stiff body, or a dog turning its head away all mean: not today, thank you.",
      },
      { type: "image", caption: "Field guide: the correct hand offer", palette: ["#DCC9A3", "#B59B77"] },
      { type: "h2", text: "4. Feeding etiquette" },
      {
        type: "p",
        text: "If you feed, feed away from roads and hostel entrances, and place food down rather than hand-feeding dogs you don't know. Biscuits are fine as an occasional social gesture; regular feeding is best routed through the PAWS feeding programme so diets stay consistent.",
      },
      { type: "h2", text: "5. When not to say hello" },
      {
        type: "p",
        text: "A dog who is eating, sleeping, injured, or nursing puppies is off duty. A dog marked 'cautious' on their PAWS profile — you can scan their collar tag to check — prefers admirers at a distance. Respecting that is the whole game: campus animals trust this campus because, mostly, we've earned it.",
      },
    ],
  },
];

export function getDemoStory(slug: string) {
  return DEMO_STORIES.find((s) => s.slug === slug);
}

export const STORY_CATEGORY_LABELS: Record<Story["category"], string> = {
  rescue: "Rescue",
  recovery: "Recovery",
  adoption: "Adoption",
  "campus-paw": "Campus Paw",
  "volunteer-diary": "Volunteer Diary",
  education: "Education",
};
