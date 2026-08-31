import type { Metadata } from "next";
import {
  projectBySlug,
  RESTAURANT_SURFACES,
  RESTAURANT_DECISIONS,
  RESTAURANT_FIGURES,
  RESTAURANT_GAPS,
  PRICING_ROWS,
} from "@/content/projects";
import CaseStudyHeader from "@/components/work/CaseStudyHeader";
import CaseSection from "@/components/work/CaseSection";
import SubNav from "@/components/work/SubNav";
import PricingTable from "@/components/work/PricingTable";
import DemoCard from "@/components/work/DemoCard";
import Ledger from "@/components/ui/Ledger";
import Reveal from "@/components/motion/Reveal";

const project = projectBySlug("restaurant");

export const metadata: Metadata = {
  title: "Restaurant ordering and till system",
  description:
    "A commercial till running daily in a restaurant in Co. Kildare. Four surfaces, one Postgres database, and a property suite that generates 560,015 orders a run trying to break the pricing.",
};

const SECTIONS = [
  { id: "what", label: "What it is" },
  { id: "surfaces", label: "Four surfaces" },
  { id: "decisions", label: "Decisions worth defending" },
  { id: "proof", label: "Proving it is right" },
  { id: "pricing", label: "Where the free side goes" },
  { id: "bug", label: "A bug class with a name" },
  { id: "gaps", label: "Honest gaps" },
  { id: "figures", label: "The figures" },
];

export default function RestaurantCaseStudy() {
  return (
    <>
      <CaseStudyHeader
        title="I built a till, then I built the thing that proves it is right"
        summary="A commercial ordering system running every day in a restaurant in Co. Kildare. One Expo codebase, four surfaces, one Postgres database, and one developer."
        status={project.status}
        stack="TypeScript 5.9 · React 19.2 · React Native 0.81.5 · Expo SDK 54 · Zustand 5.0 · Postgres via Supabase · Row level security"
        links={[
          { label: "Interactive pricing demo", href: project.demoUrl },
          { label: "Demo source", href: project.repoUrl },
          { label: "Main codebase", note: "private, a client's live system" },
        ]}
      />

      <div className="mx-auto grid max-w-shell gap-x-14 px-5 pb-8 sm:px-6 lg:grid-cols-[1fr_210px]">
        <div className="min-w-0 lg:order-1">
          <CaseSection id="what" title="What it is">
            <p>
              Four surfaces run off one Expo codebase against one Postgres
              database. The kiosk takes orders from customers with nobody
              standing over it. The kitchen till accepts and rejects them. Table
              service carries a tab across rounds. Admin does the money and the
              menu.
            </p>
            <p>
              I am the only developer on it. It went from nothing to running in
              seven weeks, in 154 commits between 13 July and 30 August 2026,
              built and maintained alongside running the kitchen. In August it
              took 251 orders and rang in 1,474 dishes.
            </p>
            <p>
              The code is private, because it is a client&apos;s live system. I am
              happy to walk through any part of it on a call.
            </p>
          </CaseSection>

          <CaseSection id="surfaces" title="Four surfaces, one database" wide>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--stroke)]">
                    <th scope="col" className="pb-3 pr-5 text-meta font-normal text-[var(--dim)]">
                      Surface
                    </th>
                    <th scope="col" className="pb-3 pr-5 text-meta font-normal text-[var(--dim)]">
                      Who uses it
                    </th>
                    <th scope="col" className="pb-3 text-meta font-normal text-[var(--dim)]">
                      What it does
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RESTAURANT_SURFACES.map((s) => (
                    <tr key={s.surface} className="border-b border-[var(--stroke)] last:border-b-0">
                      <th scope="row" className="py-4 pr-5 align-top text-body font-medium text-[var(--text)]">
                        {s.surface}
                      </th>
                      <td className="py-4 pr-5 align-top text-body text-[var(--dim)] whitespace-nowrap">
                        {s.who}
                      </td>
                      <td className="py-4 align-top text-body text-[var(--dim)]">{s.does}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CaseSection>

          <CaseSection id="decisions" title="Four decisions worth defending" wide>
            <ol className="space-y-9">
              {RESTAURANT_DECISIONS.map((d) => (
                <li key={d.n} className="grid gap-x-5 sm:grid-cols-[auto_1fr]">
                  <span className="mono text-meta text-[var(--accent)]">{d.n}</span>
                  <div className="prose-measure">
                    <h3 className="text-sub font-semibold text-[var(--text)]">{d.title}</h3>
                    <p className="mt-2 text-body text-[var(--dim)]">{d.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CaseSection>

          <CaseSection id="proof" title="Proving it is right">
            <p>
              Picking a few example orders and asserting the totals proves almost
              nothing. The suite states what has to be true of every order
              instead, then generates hundreds of thousands of orders trying to
              break those statements. 43 properties, 560,015 cases a run, about a
              second, on every change.
            </p>
            <p>
              The generator is seeded with mulberry32 and every run prints its
              seed, so a failure replays exactly rather than becoming a story
              about a bug somebody saw once.
            </p>
            <p>
              There is no test framework. No Jest, no fast-check, no build step,
              nothing to install. <span className="mono text-[14px]">npm test</span>{" "}
              runs the TypeScript sources directly using Node 22 type-stripping
              and a <span className="mono text-[14px]">module.register()</span>{" "}
              resolver hook. That is a deliberate decision and it is decision four
              above: this has to still run in a year on a laptop where nothing is
              installed.
            </p>
            <p>
              None of it needs a browser, a database or a single mock, and that is
              only possible because every money rule is a pure function that takes
              data and returns data. One pricing rule is the exception. It lives
              in Postgres and the test runner cannot execute it, so I ported it
              line for line into JavaScript. The port and the SQL are held
              together by the properties themselves, which is the only honest way
              to keep two copies of a rule in step.
            </p>
          </CaseSection>

          {/* ---------------------------------------------------------------
              The pricing story. Told in the order the brief sets out, and the
              framing in the last two paragraphs is not negotiable: nobody is
              ever charged above menu price, and the site must never imply
              otherwise.
          --------------------------------------------------------------- */}
          <CaseSection id="pricing" title="Where the free side goes" wide>
            <div className="prose-measure text-body text-[var(--dim)]">
              <p>
                A curry comes with a rice. Decline the rice and the house owes you
                a side, so a garlic naan ordered later costs €1.15 instead of
                €3.75. The restaurant is giving food away, and it means to.
              </p>
              <p>
                The till re-prices the whole order every time an item is added,
                and each pass moves one line. So the first side to receive the
                discount keeps it, even when a better candidate turns up later. It
                optimises the step rather than the basket. Tapping the same food in
                a different order can therefore produce a different bill.
              </p>
              <p>
                I measured it over 20,000 baskets, each one rung in twice.
              </p>
            </div>

            <div className="mt-8 max-w-[640px]">
              <PricingTable rows={PRICING_ROWS} />
            </div>

            <div className="prose-measure mt-10 text-body text-[var(--dim)]">
              <p>
                One curry with the rice declined, then two rices. Egg fried tapped
                first comes to €4.30. Boiled tapped first comes to €3.95.
                Identical food, 35 cents apart, and both are legitimate menu
                prices.
              </p>
              <p className="text-[var(--text)]">
                No customer is ever charged above menu price. A property asserts
                exactly that and passes 20,000 cases on every run.
              </p>
              <p>
                What varies is how large the free discount is. Sometimes the
                freebie lands on the cheaper item, so the customer&apos;s gift is
                worth less than it might have been and the house keeps the
                difference.
              </p>
              <p>
                I showed the owner the measurement and the owner chose to leave it.
                Rewriting a live pricing rule mid-service to recover 43 cents was
                not a trade worth making. So the guarantee the decision rests on,
                that the house is never undercharged, was written down as a test
                that runs on every change.
              </p>
            </div>

            <div className="mt-10">
              <DemoCard />
            </div>
          </CaseSection>

          <CaseSection id="bug" title="A bug class with a name">
            <p>
              The same rule written in two places that later disagree. It caused
              three separate production faults over the life of this project, and
              each fix shipped with a test that fails if the two copies ever
              drift apart again.
            </p>
            <p>
              One instance is worth the detail. In a plpgsql function declared{" "}
              <span className="mono text-[14px]">
                returns table(item_name text, …)
              </span>
              , that name becomes a variable for the whole body, and an
              unqualified reference to it is ambiguous. Only at run time, though.{" "}
              <span className="mono text-[14px]">create or replace</span> accepts
              it without a word. It shipped twice.
            </p>
            <p>
              The lesson generalises past Postgres. A check that queries about a
              function proves nothing. You have to call it.
            </p>
          </CaseSection>

          <CaseSection id="gaps" title="Honest gaps">
            <p className="mb-5">
              Knowing where the edges are is more useful than pretending there are
              none, so here they are.
            </p>
            <ul className="space-y-4">
              {RESTAURANT_GAPS.map((gap) => (
                <li key={gap.slice(0, 20)} className="border-l border-[var(--stroke-bright)] pl-4">
                  {gap}
                </li>
              ))}
            </ul>
          </CaseSection>

          <CaseSection id="figures" title="The figures" wide>
            <p className="prose-measure mb-8 text-body text-[var(--dim)]">
              Measured on 30 and 31 August 2026.
            </p>
            <Ledger metrics={RESTAURANT_FIGURES} countUp />
            <Reveal className="mt-8">
              <p className="prose-measure text-body text-[var(--dim)]">
                Alongside those: 50 meal deals, 110 uses of{" "}
                <span className="mono text-[14px]">security definer</span>, 31 row
                level security policies, two pg_cron jobs, 18 runtime dependencies
                and 3 dev dependencies, and a 2.5 MB static bundle.
              </p>
            </Reveal>
          </CaseSection>
        </div>

        <div className="lg:order-2">
          <SubNav items={SECTIONS} />
        </div>
      </div>
    </>
  );
}
