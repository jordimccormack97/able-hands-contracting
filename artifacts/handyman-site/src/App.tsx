import { useEffect, useMemo, useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
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
  "Carpentry",
];

const work = [
  { title: "Cedar privacy fencing", desc: "Fence installation with a custom gate.", image: "images/gate-2.jpeg" },
  { title: "Custom outdoor deck", desc: "Deck build with seating and railing.", image: "images/deck-build.jpeg" },
  { title: "Interior and exterior repairs", desc: "Drywall, trim, doors, and exterior repairs.", image: "images/work-repairs.jpg" },
];

const expectations = [
  { title: "Clear communication", desc: "You’ll know the schedule, scope, and next steps." },
  { title: "Good work", desc: "Careful work with clean results." },
  { title: "Clean jobsite", desc: "Respectful scheduling and cleanup." },
];

const CALENDLY_URL = "https://calendly.com/jordi-mccormack";
const PHONE = "(919) 533-9583";
const EMAIL = "Jordi.mccormack97@gmail.com";
const SERVICE_AREA = "RTP, Chapel Hill, Durham, Raleigh, Cary (Please inquire about locations outside those listed.)";
const HERO_IMAGE = `${import.meta.env.BASE_URL}images/main-logo.jpg`;
const LOGO_IMAGE = `${import.meta.env.BASE_URL}images/able-hands-logo-trimmed.png`;

function scrollToContact() {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}

function scrollToServices() {
  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
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
  function goToServices() {
    onContinue();
    setTimeout(() => {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-[#f5f2ec] px-5 py-6 text-[#171717]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between">
        <div>
          <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="h-28 w-auto object-contain" />
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-[-0.04em]">
            Book your consultation now.
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-black/62">
            Book a consultation or request an estimate for your home project.
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild className="h-14 w-full text-base">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#fff" }}>
                Place Job Request
              </a>
            </Button>
            <Button variant="outline" className="h-14 w-full text-base" onClick={goToServices}>
              Services Offered
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-white p-6">
          <div className="text-sm uppercase tracking-[0.18em] text-black/35">Services</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-black/65">
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

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (qrMode && !showFullSite) {
    return <QrLanding onContinue={() => setShowFullSite(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f2ec] pb-24 text-[#171717] antialiased md:pb-0">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f2ec]/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 md:flex md:flex-nowrap md:items-center md:justify-between md:px-6 md:py-5">
          <a href="#home" className="flex min-w-0 items-center gap-3" aria-label="Able Hands Contracting home">
            <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="h-11 w-auto shrink-0 object-contain md:h-14" />
            <span className="min-w-0 text-[12px] uppercase tracking-[0.16em] text-black/70 md:text-[15px] md:tracking-[0.18em]">
              Able Hands Contracting
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-black/65 md:flex">
            <a href="#home" className="transition hover:text-black">Home</a>
            <a href="#work" className="transition hover:text-black">Work</a>
            <a href="#services" className="transition hover:text-black">Services</a>
            <a href="#about" className="transition hover:text-black">About</a>
            <a href="#reviews" className="transition hover:text-black">Reviews</a>
            <a href="#contact" className="transition hover:text-black">Contact</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button asChild className="bg-[#1f8a4c] text-white hover:bg-[#18743f]">
              <a href="tel:9195339583">☎ 919-533-9583</a>
            </Button>
            <Button asChild variant="outline">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                Place Job Request
              </a>
            </Button>
            <Button onClick={scrollToServices}>Services Offered</Button>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 md:hidden">
            <Button asChild size="sm" className="min-w-0 bg-[#1f8a4c] px-2 text-xs text-white hover:bg-[#18743f]">
              <a href="tel:9195339583">
                <span className="min-[430px]:hidden">☎ Call</span>
                <span className="hidden min-[430px]:inline">☎ 919-533-9583</span>
              </a>
            </Button>
            <Button asChild size="sm" className="min-w-0 px-2 text-xs">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#fff" }}>
                Place Job Request
              </a>
            </Button>
            <Button size="sm" variant="outline" className="min-w-0 px-2 text-xs" onClick={scrollToServices}>Services</Button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="mx-auto max-w-7xl px-4 pb-14 pt-14 md:px-6 md:pb-24 md:pt-28">
          <div className="grid gap-8 min-[560px]:grid-cols-[0.95fr_1.05fr] min-[560px]:items-start lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-3xl">
              <div className="mb-5 text-[11px] uppercase tracking-[0.28em] text-black/45 md:mb-6 md:text-[12px]">
                Handyman and contracting services in the Triangle
              </div>
              <h1 className="text-4xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-5xl md:text-7xl lg:text-[88px]">
                Home repairs
                <br />
                and outdoor
                <br />
                projects.
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-7 text-black/62 md:mt-8 md:text-[18px] md:leading-8">
                Able Hands Contracting handles all project types from small home repairs to full deck and fence installations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="flex h-[320px] items-center justify-center p-3 shadow-none min-[560px]:h-[260px] md:h-[430px] md:p-5 lg:h-[500px]">
                <img
                  src={LOGO_IMAGE}
                  alt="Able Hands Contracting"
                  className="max-h-full w-full object-contain"
                  loading="eager"
                />
              </Card>
              <Card className="overflow-hidden shadow-none">
                <div className="relative h-[320px] min-[560px]:h-[260px] md:h-[430px] lg:h-[500px]">
                  <img
                    src={HERO_IMAGE}
                    alt="Jordi McCormack — Able Hands Contracting"
                    className="h-full w-full object-cover object-[50%_18%] absolute inset-0"
                    loading="eager"
                  />
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6 md:pb-12">
          <div className="grid gap-px overflow-hidden rounded-[2rem] bg-black/6 md:grid-cols-3">
            {[
              ["Work", "Repairs, builds, and installs for homes and outdoor spaces."],
              ["Process", "Clear scope, scheduling, and follow-up."],
              ["Service area", "Chapel Hill, Durham, Raleigh, Cary, and nearby areas."],
            ].map(([title, desc]) => (
              <div key={title} className="bg-[#f8f5ef] p-7 md:p-10">
                <div className="text-sm uppercase tracking-[0.18em] text-black/35">{title}</div>
                <p className="mt-4 max-w-sm text-base leading-7 text-black/60">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[12px] uppercase tracking-[0.28em] text-black/40">Past Work</div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
                Past work.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2 xl:grid-cols-3">
            {work.map((item, i) => (
              <Card key={i} className="overflow-hidden shadow-none">
                <div className="relative min-h-[240px] md:min-h-[300px]">
                  <img
                    src={`${import.meta.env.BASE_URL}${item.image}`}
                    alt={item.title}
                    className="h-full w-full object-cover absolute inset-0"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-6 md:p-7">
                  <div className="text-lg font-medium tracking-[-0.02em] md:text-xl">{item.title}</div>
                  <p className="mt-3 text-[15px] leading-7 text-black/55">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div className="max-w-3xl">
            <div className="text-[12px] uppercase tracking-[0.28em] text-black/40">Services</div>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
              Services
              <br />
              offered.
            </h2>
          </div>

          <div className="mt-10 rounded-[2rem] border border-black/6 bg-[#f8f5ef] p-6 md:mt-14 md:p-10">
            <ul className="grid gap-x-10 gap-y-4 text-[15px] leading-6 text-black/65 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li key={service} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f8a4c]" aria-hidden="true" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-28 md:pt-12">
          <div>
            <div className="max-w-3xl">
              <div className="text-[12px] uppercase tracking-[0.28em] text-black/40">About</div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
                About Jordi
                <br />
                and Able Hands Contracting.
              </h2>
              <div className="mt-8 space-y-6 text-[16px] leading-7 text-black/62 md:text-[17px] md:leading-8">
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
            <div className="text-[12px] uppercase tracking-[0.28em] text-black/40">What to expect</div>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-6xl">
              What you can expect.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-3">
            {expectations.map((item, i) => (
              <Card key={i} className="shadow-none">
                <CardContent className="p-7 md:p-8">
                  <h3 className="text-lg font-medium tracking-[-0.02em]">{item.title}</h3>
                  <p className="mt-4 text-[15px] leading-8 text-black/62">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-28">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-[2.5rem] shadow-none">
              <CardContent className="p-8 md:p-10">
                <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="mb-8 h-24 w-auto object-contain" />
                <div className="text-[12px] uppercase tracking-[0.28em] text-black/40">Contact</div>
                <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                  Start your project.
                </h2>
                <p className="mt-5 max-w-xl text-[16px] leading-8 text-black/58">
                  Send your contact information and a short project description, or book a consultation directly.
                </p>

                <ContactForm calendlyUrl={CALENDLY_URL} />

                <div className="mt-10 grid gap-4 text-sm text-black/50">
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f5f2ec]/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-md gap-3">
            <Button asChild className="h-12 flex-1">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#fff" }}>
                Place Job Request
              </a>
            </Button>
            <Button className="h-12 flex-1" variant="outline" onClick={scrollToServices}>Services Offered</Button>
          </div>
        </div>
      )}

      <footer className="border-t border-black/6 bg-[#f5f2ec]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_IMAGE} alt="Able Hands Contracting" className="h-20 w-auto object-contain" />
            <div>
              <div className="text-[13px] uppercase tracking-[0.18em] text-black/55">Able Hands Contracting</div>
              <div className="mt-2 text-sm text-black/45">Home repairs and outdoor projects.</div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={scrollToContact}>Submit Project Info</Button>
            <Button asChild className="w-full sm:w-auto" variant="outline">
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                Place Job Request
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
