import { useEffect, useMemo, useState } from "react";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { ContactForm } from "./components/ContactForm";

const services = [
  "Lightbulb Replacement",
  "Air Filter Changing",
  "Picture & Mirror Hanging",
  "Shelf Installation",
  "Door/Doorknob Replacement",
  "Furniture Assembly",
  "TV Mounting",
  "Bathroom Hardware Installation",
  "Carbon Detector Battery Replacement",
  "Curtain & Blinds Installation",
  "Cabinet & Drawer Handle Installation",
  "RING/Smart Doorbell Installation",
  "Weather Stripping",
  "Dryer Vent Cleaning",
  "Basic Home Troubleshooting",
  "Exterior Maintenance",
  "Shower Head Replacement",
  "Ceiling Fan Replacement",
  "Light Fixture Replacement",
  "Minor Plumbing Fixes",
  "Garbage Disposal Replacement",
  "Home Upgrade Services",
  "Smart Home Device Setup",
  "Assistance With Technology",
  "Basic Property Management",
  "Closet System Installation",
  "Garage Organization",
  "Home Office Setup",
  "Baby Proofing",
  "Senior Proofing",
  "Room Measurement and Layout Planning",
  "Bulky Item Pickup & Delivery",
  "Deck Building/Repair",
  "Fencing",
  "Fence Repair",
  "Staining",
  "Carpentry",
  "Custom Carpentry",
];

const work = [
  { title: "Cedar privacy fencing", desc: "Fence installation with a custom gate.", image: "images/privacy-fence-stock.jpg" },
  { title: "Custom outdoor deck", desc: "Deck build with seating and railing.", image: "images/deck-build.jpeg" },
  { title: "Interior and exterior repairs", desc: "Drywall, trim, doors, and exterior repairs.", image: "images/interior-exterior-repairs-stock.jpg" },
];

const expectations = [
  { title: "Clear communication", desc: "You’ll know the schedule, scope, and next steps." },
  { title: "Good work", desc: "Careful work with clean results." },
  { title: "Clean jobsite", desc: "Respectful scheduling and cleanup." },
];

const CALENDLY_URL = "https://calendly.com/jordi-mccormack";
const PHONE = "(630) 487-1834";
const PHONE_LINK = "tel:6304871834";
const EMAIL = "Jordi.mccormack97@gmail.com";
const SERVICE_AREA = "RTP, Chapel Hill, Durham, Raleigh, Cary (Please inquire about locations outside those listed.)";
const LOGO_IMAGE = `${import.meta.env.BASE_URL}images/able-hands-logo-trimmed.png`;
const HERO_IMAGE = `${import.meta.env.BASE_URL}images/hero-worktable.jpg`;
const ANA_IMAGE = `${import.meta.env.BASE_URL}images/ana-schardong.jpg`;
const JORDI_IMAGE = `${import.meta.env.BASE_URL}images/jordi-mccormack-owner.jpg`;

const contactTeam = [
  { name: "Ana Schardong", title: "Business Operations Manager", image: ANA_IMAGE },
  { name: "Jordi McCormack", title: "Owner", image: JORDI_IMAGE },
];

function scrollToContact() {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}

function scrollToServices() {
  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
}

function scrollToPortfolio() {
  document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" });
}

function scrollToContactUs() {
  document.getElementById("contact-us")?.scrollIntoView({ behavior: "smooth" });
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

function useQrMode() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("src") === "qr";
  }, []);
}

function QrLanding({ onContinue }: { onContinue: () => void }) {
  function goToContact() {
    onContinue();
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function goToServices() {
    onContinue();
    setTimeout(() => {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-[#e7e7e7] px-5 py-6 text-[#205070]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between">
        <div>
          <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="h-44 w-auto object-contain" />
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-[-0.04em]">
            Book your consultation now.
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-[#205070]/75">
            Book a consultation or request an estimate for your home project.
          </p>

          <div className="mt-8 space-y-3">
            <Button className="h-14 w-full text-base" onClick={goToContact}>
              Place Job Request
            </Button>
            <Button variant="outline" className="h-14 w-full text-base" onClick={goToServices}>
              List of Services
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#80a0d0]/25 bg-white p-6">
          <div className="text-sm uppercase tracking-[0.18em] text-[#80a0d0]">Services</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#205070]/80">
            {services.slice(0, 6).map((service) => (
              <div key={service} className="rounded-2xl bg-[#f8f5ef] px-4 py-3">
                {service}
              </div>
            ))}
          </div>
          <Button variant="ghost" className="mt-5 px-0 text-sm" onClick={onContinue}>
            View full site
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const qrMode = useQrMode();
  const [showFullSite, setShowFullSite] = useState(!qrMode);
  const [isMobile, setIsMobile] = useState(() => isMobileViewport());
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function menuScrollToContact() {
    closeMenu();
    scrollToContact();
  }

  function menuScrollToServices() {
    closeMenu();
    scrollToServices();
  }

  function menuScrollToPortfolio() {
    closeMenu();
    scrollToPortfolio();
  }

  function menuScrollToContactUs() {
    closeMenu();
    scrollToContactUs();
  }

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (qrMode && !showFullSite) {
    return <QrLanding onContinue={() => setShowFullSite(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#e7e7e7] pb-24 text-[#205070] antialiased md:pb-0">
      <header className="sticky top-0 z-30 border-b border-[#80a0d0]/25 bg-[#e7e7e7]/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-5">
          <a href="#home" className="flex min-w-0 items-center gap-3" aria-label="Able Hands Contracting home">
            <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="h-16 w-auto shrink-0 object-contain md:h-20" />
            <span className="min-w-0">
              <span className="block text-[12px] uppercase tracking-[0.16em] text-[#205070] md:text-[15px] md:tracking-[0.18em]">
                Able Hands Contracting
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-[#80a0d0] md:text-[11px]">
                Capable. Reliable. Done.
              </span>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild className="h-11 bg-[#1f8a4c] px-3 text-white hover:bg-[#18743f] sm:px-4">
              <a href={PHONE_LINK}>
                <Phone className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only sm:inline">{PHONE}</span>
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 shrink-0 p-0"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {menuOpen && (
            <div className="absolute right-4 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-[1.5rem] border border-[#80a0d0]/35 bg-[#f8f5ef] p-3 shadow-xl md:right-6">
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-[#205070] transition hover:bg-[#80a0d0]/20 hover:text-[#205070]"
                onClick={closeMenu}
              >
                Book Meeting
              </a>
              <button
                type="button"
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[#205070] transition hover:bg-[#80a0d0]/20 hover:text-[#205070]"
                onClick={menuScrollToContact}
              >
                Place Job Request
              </button>
              <button
                type="button"
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[#205070] transition hover:bg-[#80a0d0]/20 hover:text-[#205070]"
                onClick={menuScrollToServices}
              >
                List of Services
              </button>
              <button
                type="button"
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[#205070] transition hover:bg-[#80a0d0]/20 hover:text-[#205070]"
                onClick={menuScrollToPortfolio}
              >
                Portfolio
              </button>
              <button
                type="button"
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[#205070] transition hover:bg-[#80a0d0]/20 hover:text-[#205070]"
                onClick={menuScrollToContactUs}
              >
                Contact Us
              </button>
              <a
                href={PHONE_LINK}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-[#205070] transition hover:bg-[#80a0d0]/20 hover:text-[#205070]"
                onClick={closeMenu}
              >
                Call 630-487-1834
              </a>
            </div>
          )}
        </div>
      </header>

      <main>
        <section id="home" className="relative isolate flex min-h-[calc(100vh-7rem)] items-start justify-center overflow-hidden px-4 pb-8 pt-2 md:min-h-[calc(100vh-6rem)] md:px-6 md:pb-20 md:pt-4">
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            aria-hidden="true"
            loading="eager"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#e7e7e7]/90 via-[#e7e7e7]/75 to-[#e7e7e7]/95 backdrop-blur-[1px]" aria-hidden="true" />
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:text-left md:gap-6">
              <img
                src={LOGO_IMAGE}
                alt="Able Hands Contracting"
                className="h-56 w-auto shrink-0 object-contain sm:h-72 md:h-[26rem] lg:h-[30rem]"
                loading="eager"
              />
              <h1 className="text-4xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-6xl lg:text-[76px]">
                Able Hands
                <br />
                Contracting
              </h1>
            </div>
            <div className="mt-3 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center md:mt-4">
              <Button className="h-14 w-full text-base sm:w-auto" onClick={scrollToContact}>
                Place Job Request
              </Button>
              <Button variant="outline" className="h-14 w-full text-base sm:w-auto" onClick={scrollToServices}>
                List of Services
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6 md:pb-12">
          <div className="grid gap-px overflow-hidden rounded-[2rem] bg-[#80a0d0]/25 md:grid-cols-3">
            {[
              ["Portfolio", "Repairs, builds, and installs for homes and outdoor spaces."],
              ["Process", "Clear scope, scheduling, and follow-up."],
              ["Service area", "Chapel Hill, Durham, Raleigh, Cary, and nearby areas."],
            ].map(([title, desc]) => (
              <div key={title} className="bg-[#f8f5ef] p-7 md:p-10">
                <div className="text-sm uppercase tracking-[0.18em] text-[#80a0d0]">{title}</div>
                <p className="mt-4 max-w-sm text-base leading-7 text-[#205070]/75">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div className="max-w-3xl">
            <div className="text-[12px] uppercase tracking-[0.28em] text-[#80a0d0]">Services</div>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
              Services
              <br />
              offered.
            </h2>
          </div>

          <div className="mt-10 rounded-[2rem] border border-[#80a0d0]/25 bg-[#f8f5ef] p-6 md:mt-14 md:p-10">
            <ul className="grid gap-x-10 gap-y-4 text-[15px] leading-6 text-[#205070]/80 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li key={service} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#205070]" aria-hidden="true" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="portfolio" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[12px] uppercase tracking-[0.28em] text-[#80a0d0]">Portfolio</div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
                Portfolio.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid auto-rows-[220px] gap-3 md:mt-14 md:grid-cols-4 md:auto-rows-[260px]">
            {work.map((item, i) => (
              <Card
                key={item.title}
                className={`group overflow-hidden shadow-none ${i === 0 ? "md:col-span-2 md:row-span-2" : "md:col-span-2"}`}
              >
                <div className="relative h-full min-h-full">
                  <img
                    src={`${import.meta.env.BASE_URL}${item.image}`}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
                    <div className="text-lg font-medium tracking-[-0.02em] md:text-xl">{item.title}</div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/78">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-28 md:pt-12">
          <div>
            <div className="max-w-3xl">
              <div className="text-[12px] uppercase tracking-[0.28em] text-[#80a0d0]">About</div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
                About Jordi
                <br />
                and Able Hands Contracting.
              </h2>
              <div className="mt-8 space-y-6 text-[16px] leading-7 text-[#205070]/75 md:text-[17px] md:leading-8">
                <p>
                  Jordi McCormack owns Able Hands Contracting. He attended UNC Chapel Hill and chose hands-on work over a traditional corporate path, building a business around practical skills, problem-solving, and reliable service.
                </p>
                <p>
                  Able Hands Contracting focuses on clear communication, clean work, and practical results for every home project. Jordi takes pride in showing up on time, understanding what each client needs, and completing work with care and attention to detail. Whether it’s repairs, improvements, or small construction projects, the goal is to make the process straightforward, professional, and stress-free for homeowners.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="reviews" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div>
            <div className="text-[12px] uppercase tracking-[0.28em] text-[#80a0d0]">What to expect</div>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
              What you can expect.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-3">
            {expectations.map((item, i) => (
              <Card key={i} className="shadow-none">
                <CardContent className="p-7 md:p-8">
                  <h3 className="text-lg font-medium tracking-[-0.02em]">{item.title}</h3>
                  <p className="mt-4 text-[15px] leading-8 text-[#205070]/75">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="contact-us" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div>
            <div className="max-w-3xl">
              <div className="text-[12px] uppercase tracking-[0.28em] text-[#80a0d0]">Contact Us</div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
                Talk with our team.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
              {contactTeam.map((person) => (
                <Card key={person.name} className="overflow-hidden shadow-none">
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="relative min-h-[280px] md:min-h-[320px]">
                      <img
                        src={person.image}
                        alt={person.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="flex flex-col justify-center p-7 md:p-10">
                      <div className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">{person.name}</div>
                      <div className="mt-3 text-sm uppercase tracking-[0.18em] text-[#80a0d0]">
                        {person.title}
                      </div>
                      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Button asChild className="w-full sm:w-auto bg-[#1f8a4c] text-white hover:bg-[#18743f]">
                          <a href={PHONE_LINK}>Call {PHONE}</a>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-[2.5rem] shadow-none">
              <CardContent className="p-8 md:p-10">
                <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="mb-8 h-44 w-auto object-contain" />
                <div className="text-[12px] uppercase tracking-[0.28em] text-[#80a0d0]">Contact</div>
                <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                  Start your project.
                </h2>
                <p className="mt-5 max-w-xl text-[16px] leading-8 text-[#205070]/70">
                  Send your contact information and a short project description, or book a consultation directly.
                </p>

                <ContactForm calendlyUrl={CALENDLY_URL} />

                <div className="mt-10 grid gap-4 text-sm text-[#205070]/60">
                  <div className="flex items-center gap-3"><Phone className="h-4 w-4" /> {PHONE}</div>
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4" /> {EMAIL}</div>
                  <div className="flex items-center gap-3"><MapPin className="h-4 w-4" /> {SERVICE_AREA}</div>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>
      </main>

      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#80a0d0]/35 bg-[#e7e7e7]/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-md gap-3">
            <Button className="h-12 flex-1" onClick={scrollToContact}>Place Job Request</Button>
            <Button className="h-12 flex-1" variant="outline" onClick={scrollToServices}>List of Services</Button>
          </div>
        </div>
      )}

      <footer className="border-t border-[#80a0d0]/25 bg-[#e7e7e7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="h-40 w-auto object-contain" />
            <div>
              <div className="text-[13px] uppercase tracking-[0.18em] text-[#205070]/65">Able Hands Contracting</div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={scrollToContact}>Submit Project Info</Button>
            <Button asChild className="w-full sm:w-auto" variant="outline">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                Book Meeting
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
