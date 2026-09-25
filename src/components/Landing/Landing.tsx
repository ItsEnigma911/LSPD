import React from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { Panel } from "../ui";
import TopNav from "./TopNav";

const Landing: React.FC = () => {
  const { data } = useData();
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      {/* Hero */}
      <header className="px-6 md:px-16 pt-16 pb-12 border-b border-ink-600/40">
        <div className="max-w-2xl">
          <p className="font-display text-brass-400 tracking-[0.15em] text-sm mb-3">
            CITY OF LOS SANTOS
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] text-bone-100">
            Los Santos Police
            <br />
            Department
          </h1>
          <p className="mt-5 max-w-xl text-bone-400 leading-relaxed">
            A roleplay police department built around six working divisions, a real
            rank structure, and a portal where every officer logs duty activity,
            builds cases, and stays in contact with their unit — in character and
            out.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-sm bg-brass-500 hover:bg-brass-400 text-ink-950 font-display font-medium tracking-wide transition-colors"
            >
              Member Login
            </Link>
            <a
              href="#divisions"
              className="px-5 py-2.5 rounded-sm border border-ink-600/60 backdrop-blur-md hover:border-brass-500 hover:text-brass-400 text-bone-100 font-display tracking-wide transition-colors"
            >
              View Divisions
            </a>
          </div>
        </div>
      </header>

      {/* About the department + the division roster box side by side */}
      <main id="divisions" className="flex-1 px-6 md:px-16 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left column — the department, in longer form */}
          <div className="space-y-10">
            <section>
              <p className="font-display text-sm tracking-[0.15em] text-brass-400 mb-3">
                ABOUT THE DEPARTMENT
              </p>
              <h2 className="font-display text-2xl text-bone-100 mb-3">
                One badge, six specialties
              </h2>
              <p className="text-bone-400 leading-relaxed">
                The LSPD runs on the same structure a real department does: patrol
                officers work the streets, specialized divisions handle everything
                from tactical response to undercover work, and a command staff of
                three — Assistant Chief, Deputy Chief, and Chief of Police —
                oversees promotions and department-wide decisions. Every member
                logs into the same portal to file activity, pull up cases, and
                talk to their unit, whether they're brand new or wearing captain's
                bars.
              </p>
            </section>

            <section>
              <p className="font-display text-sm tracking-[0.15em] text-brass-400 mb-3">
                HOW IT WORKS
              </p>
              <h2 className="font-display text-2xl text-bone-100 mb-4">
                From cadet to command
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "01",
                    title: "Log your duty time",
                    body: "Patrols, arrests, trainings, and events all earn points toward your next rank.",
                  },
                  {
                    step: "02",
                    title: "Get tagged into a division",
                    body: "Command staff assign division tags, unlocking that division's tools, chat, and archives.",
                  },
                  {
                    step: "03",
                    title: "Work your caseload",
                    body: "CID builds full case files — officers, wanted persons, BOLOs, evidence, and a written narrative.",
                  },
                ].map((item) => (
                  <Panel key={item.step} className="p-4">
                    <p className="font-display text-brass-400 text-sm mb-2">{item.step}</p>
                    <p className="text-sm text-bone-100 font-medium mb-1">{item.title}</p>
                    <p className="text-xs text-bone-400 leading-relaxed">{item.body}</p>
                  </Panel>
                ))}
              </div>
            </section>

            <section>
              <p className="font-display text-sm tracking-[0.15em] text-brass-400 mb-3">
                CONDUCT
              </p>
              <h2 className="font-display text-2xl text-bone-100 mb-3">
                Roleplay first, always
              </h2>
              <p className="text-bone-400 leading-relaxed">
                This portal exists to support the roleplay, not replace it. Case
                files, BOLOs, and activity logs are meant to mirror what's actually
                happening in-city — keep entries accurate, keep chat professional,
                and remember every division shares the same badge.
              </p>
            </section>
          </div>

          {/* Right column — the long, narrow division roster box */}
          <div className="lg:sticky lg:top-16">
            <p className="font-display text-sm tracking-[0.15em] text-bone-400 mb-3">
              DEPARTMENT DIVISIONS
            </p>
            <Panel className="p-5">
              <p className="text-sm text-bone-400 leading-relaxed mb-5">
                Every officer starts on patrol. These are the six divisions you can
                be tagged into as you rank up:
              </p>
              <div className="space-y-3">
                {data.divisions.map((division) => (
                  <div
                    key={division.key}
                    className="relative bg-ink-900/40 border border-ink-600/40 rounded-md p-3.5 flex gap-3 items-start hover:border-brass-500/60 transition-colors"
                  >
                    <span
                      className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-md"
                      style={{ backgroundColor: division.color }}
                    />
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 border"
                      style={{ backgroundColor: `${division.color}22`, borderColor: `${division.color}55` }}
                    >
                      {division.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-sm text-bone-100 tracking-wide">
                        {division.name}
                      </h3>
                      <p className="text-xs text-bone-400 mt-0.5 leading-snug">
                        {division.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-16 py-6 border-t border-ink-600/40 text-xs text-bone-400">
        Fictional server for GTA roleplay purposes. Not affiliated with any real law enforcement agency.
      </footer>
    </div>
  );
};

export default Landing;
