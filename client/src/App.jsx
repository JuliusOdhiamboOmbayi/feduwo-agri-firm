import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown, ChevronRight,
  ClipboardList, Leaf, Linkedin, Mail, Menu, Phone, Sprout, Users, Wheat, X,
} from "lucide-react";
import api from "./api.js";

const photos = {
  hero: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=85",
  field: "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1100&q=85",
  hands: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1100&q=85",
  crops: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1100&q=85",
  training: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&w=1200&q=85",
  soil: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1000&q=85",
  farm: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1000&q=85",
};

const services = [
  { title: "Agricultural consultancy", text: "Practical farm assessments, production advice and planning to help your operation make informed decisions.", details: "Farm assessment · Crop production advisory · Livestock management · Farm planning · Productivity improvement · Project advisory", benefit: "Clearer farm decisions and more focused production plans.", icon: Sprout },
  { title: "Soil & water management", text: "Build healthier soils and plan responsible water use with site-aware conservation and irrigation guidance.", details: "Soil fertility assessment · Soil conservation · Irrigation planning · Water management · Sustainable land management", benefit: "More informed stewardship of soil, water and land resources.", icon: Leaf },
  { title: "Crop protection", text: "Identify crop health challenges and develop integrated, considered approaches to pest and disease management.", details: "Pest and disease identification · Integrated pest management · Crop monitoring · Production best practices", benefit: "Timely crop decisions and considered protection strategies.", icon: Wheat },
  { title: "Livestock management", text: "Strengthen animal husbandry, nutrition, housing and day-to-day livestock production practices.", details: "Animal husbandry · Livestock housing · Feeding and nutrition · Production planning · Productivity improvement", benefit: "Practical guidance for healthier, better-managed livestock.", icon: BadgeCheck },
  { title: "Agricultural staffing", text: "Connect agricultural organizations with qualified professionals and farm teams suited to their needs.", details: "Professional recruitment · Farm managers · Agronomists · Technicians · Extension officers · Workforce placement", benefit: "A more capable agricultural workforce aligned to your operation.", icon: Users },
  { title: "Training & capacity building", text: "Equip farmers and teams with relevant, practical knowledge in climate-smart agriculture and agribusiness.", details: "Modern farming · Climate-smart agriculture · Agribusiness · Farm finance · Technology adoption · Farmer capacity building", benefit: "Relevant knowledge and skills your team can put into practice.", icon: BookOpen },
  { title: "Agribusiness development", text: "Support farm business planning, value-chain thinking, market linkages and investment decisions.", details: "Business planning · Value-chain development · Market linkage advisory · Investment guidance · Productivity improvement", benefit: "Stronger foundations for sustainable agricultural enterprise.", icon: ClipboardList },
];

const navItems = [
  ["/", "Home"], ["/about", "About"], ["/services", "Services"], ["/training", "Training"],
  ["/careers", "Staffing & Careers"], ["/projects", "Projects"], ["/resources", "Resources"], ["/contact", "Contact"],
];

function PageMeta({ title, description }) {
  useEffect(() => {
    document.title = `${title} | FEDUWO AGRI CONSULTANT`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
  }, [title, description]);
  return null;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); setServiceOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  return <>
    <div className="topline"><div className="wrap topline-inner"><span>Practical expertise. A more resilient agriculture.</span><div><a href="tel:+254114110603"><Phone size={13} /> +254 114 110 603</a><a href="mailto:feduwofelix@gmail.com"><Mail size={13} /> feduwofelix@gmail.com</a></div></div></div>
    <header className="site-header">
      <div className="wrap nav-wrap">
        <Link to="/" className="brand" aria-label="FEDUWO Agri Consultant home"><img src="/logo.png" alt="FEDUWO Agri Consultant" /></Link>
        <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <nav className={open ? "main-nav open" : "main-nav"} aria-label="Main navigation">
          {navItems.map(([path, label]) => path === "/services" ? <div className="nav-dropdown" key={path}>
            <NavLink to={path} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Services <ChevronDown size={14} onClick={(event) => { event.preventDefault(); setServiceOpen(!serviceOpen); }} /></NavLink>
            {serviceOpen && <div className="dropdown-panel">{services.slice(0, 5).map((service) => <Link key={service.title} to="/services">{service.title}</Link>)}</div>}
          </div> : <NavLink key={path} to={path} end={path === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>{label}</NavLink>)}
          <Link className="button button-small nav-cta" to="/contact?type=consultation">Request consultation <ArrowUpRight size={15} /></Link>
        </nav>
      </div>
    </header>
  </>;
}

function Footer() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const subscribe = async (event) => {
    event.preventDefault();
    try { await api.post("/newsletter", { email }); setNotice("Thank you — your subscription is confirmed."); setEmail(""); }
    catch (error) { setNotice(error.response?.data?.message || "We couldn't save your subscription. Please try again."); }
  };
  return <footer className="footer">
    <div className="wrap footer-main">
      <div className="footer-about"><Link to="/"><img src="/logo.png" alt="FEDUWO Agri Consultant" /></Link><p>Practical agricultural advisory, training and staffing for farmers, professionals and agribusinesses across Kenya.</p><div className="socials"><a aria-label="LinkedIn" href="https://www.linkedin.com/groups/9890337" target="_blank" rel="noreferrer"><Linkedin size={17} /></a><a aria-label="Email us" href="mailto:feduwofelix@gmail.com"><Mail size={17} /></a><a aria-label="Call us" href="tel:+254114110603"><Phone size={17} /></a></div></div>
      <div><h3>Explore</h3>{navItems.slice(1, 7).map(([path, label]) => <Link className="footer-link" key={path} to={path}>{label}</Link>)}</div>
      <div><h3>Get in touch</h3><a className="footer-link" href="tel:+254114110603">+254 114 110 603</a><a className="footer-link" href="mailto:feduwofelix@gmail.com">feduwofelix@gmail.com</a><a className="footer-link" href="https://wa.me/254114110603" target="_blank" rel="noreferrer">WhatsApp us</a><span className="footer-link">Serving clients across Kenya</span></div>
      <div className="newsletter"><h3>Field notes, delivered</h3><p>Occasional agricultural insights and programme updates.</p><form onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required /><button aria-label="Subscribe" type="submit"><ArrowRight size={18} /></button></form>{notice && <small role="status">{notice}</small>}</div>
    </div>
    <div className="footer-bottom"><div className="wrap footer-bottom-inner"><span>© {new Date().getFullYear()} FEDUWO AGRI CONSULTANT. All rights reserved.</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><span>Built for a thriving agricultural future.</span></div></div></div>
  </footer>;
}

function SectionHeading({ eyebrow, title, text, light = false }) {
  return <div className={`section-heading ${light ? "light" : ""}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

function ServiceCard({ service, index }) {
  const Icon = service.icon;
  return <motion.article className="service-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, delay: index * 0.04 }}>
    <div className="icon-box"><Icon size={22} strokeWidth={1.7} /></div><h3>{service.title}</h3><p>{service.text}</p><Link className="text-link" to={`/contact?service=${encodeURIComponent(service.title)}`}>Explore this service <ArrowRight size={16} /></Link>
  </motion.article>;
}

function HomeHighlights() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/projects").then(({ data }) => setProjects(data.slice(0, 3))).catch(() => setError("Verified project profiles are temporarily unavailable.")); }, []);
  return <section className="home-projects section-pad"><div className="wrap"><div className="showcase-heading"><SectionHeading eyebrow="FEATURED PROJECTS" title="Agricultural progress, together" text="Only projects with confirmed details and permission are featured here."/><Link className="text-link" to="/projects">Explore our portfolio <ArrowRight size={16}/></Link></div>{error ? <p className="form-error">{error}</p> : projects.length ? <div className="article-grid">{projects.map((project) => <article className="article-card" key={project._id}><div className="article-image" style={{ backgroundImage: `url(${project.images?.[0] || photos.field})` }}/><div className="article-content"><span className="eyebrow">{project.category || "AGRICULTURE"} · {project.location || "Kenya"}</span><h3>{project.title}</h3><p>{project.description}</p></div></article>)}</div> : <div className="portfolio-note"><Sprout size={19}/><p>Verified project profiles will be featured when confirmed details and publishing permissions are available.</p></div>}</div></section>;
}

function Home() {
  return <>
    <PageMeta title="Growing a better future" description="Agricultural consultants in Kenya providing farm advisory, training, agribusiness and agricultural staffing solutions." />
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(10,36,26,.88) 0%, rgba(10,36,26,.67) 43%, rgba(10,36,26,.08) 100%), url(${photos.hero})` }}>
      <div className="wrap hero-inner"><div className="hero-copy"><span className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> AGRICULTURE, WITH PURPOSE</span>
        <h1>Transforming agriculture<br /><em>through expert consultancy,<br />innovation and sustainable solutions.</em></h1>
        <p>FEDUWO AGRI CONSULTANT empowers farmers, agricultural professionals and agribusinesses through expert advisory services, professional agricultural staffing, farmer training and sustainable agricultural solutions.</p>
        <div className="hero-actions"><Link className="button" to="/contact?type=consultation">Request consultation <ArrowUpRight size={17} /></Link><Link className="button button-outline" to="/services">Explore our services <ArrowRight size={16} /></Link></div>
      </div><div className="hero-note"><span className="hero-note-icon"><Sprout size={19} /></span><span>Rooted in practical knowledge.<br /><strong>Focused on lasting outcomes.</strong></span></div></div>
      <a href="#intro" className="scroll-cue" aria-label="Scroll to learn more"><ArrowDown size={17} /></a>
    </section>
    <section id="intro" className="intro-section section-pad"><div className="wrap intro-grid">
      <div className="intro-image-wrap"><img src={photos.hands} alt="Farmer tending to growing crops" loading="lazy" /><div className="image-caption"><Sprout size={17} /><span>Building practical pathways<br />for agricultural growth</span></div></div>
      <div className="intro-copy"><span className="eyebrow">ABOUT FEDUWO</span><h2>A stronger harvest starts with the right support.</h2><p>Every farm and agribusiness has its own goals and challenges. FEDUWO AGRI CONSULTANT works alongside clients to shape practical plans, strengthen skills and make informed decisions at every stage of production.</p><p>From farm management and crop production to agricultural staffing and farmer training, our work is grounded in responsible practice and the realities of agriculture in Kenya.</p><Link className="text-link" to="/about">Get to know us <ArrowRight size={16} /></Link></div>
    </div></section>
    <section className="services-section section-pad"><div className="wrap"><SectionHeading eyebrow="WHAT WE DO" title="Expertise for every stage of growth" text="Thoughtful, practical services designed around the people and businesses shaping agriculture."/><div className="services-grid">{services.slice(0, 6).map((s, i) => <ServiceCard key={s.title} service={s} index={i} />)}</div><div className="center-action"><Link className="button button-dark" to="/services">Discover all services <ArrowRight size={16} /></Link></div></div></section>
    <section className="approach-section section-pad"><div className="wrap approach-grid"><div className="approach-copy"><span className="eyebrow eyebrow-light">OUR APPROACH</span><h2>Progress that takes root<br />in the real world.</h2><p>Good advice meets people where they are. We combine agricultural knowledge with listening, collaboration and a clear focus on long-term resilience.</p><Link className="button button-light" to="/about">How we work <ArrowRight size={16} /></Link></div><div className="approach-points">{[
      ["01", "Listen first", "Understand your goals, context and constraints before recommending a path."],
      ["02", "Plan together", "Build practical, locally relevant approaches with the people who will put them into action."],
      ["03", "Grow sustainably", "Keep productivity, environmental stewardship and long-term value in view."],
    ].map(([n, title, text]) => <div className="approach-point" key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section>
    <section className="impact-section section-pad"><div className="wrap"><SectionHeading eyebrow="OUR INTENDED IMPACT" title="Progress that can be seen in the field." text="We focus on outcomes that matter to agricultural communities and enterprises. Verified achievements will be shared with context—not assumed or overstated."/><div className="impact-grid">{[["Farm productivity", "Practical advice that supports informed, productive farm decisions."], ["Farmer capacity", "Relevant learning and professional support for agricultural teams."], ["Resilient systems", "Climate-aware approaches that consider long-term farm resilience."], ["Sustainable resources", "Responsible stewardship of soil, water and agricultural land."]].map(([title, text]) => <article key={title}><Sprout size={19}/><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <HomeHighlights />
    <section className="training-band"><div className="wrap training-band-inner"><img src={photos.training} alt="Agricultural learning and training in the field" loading="lazy" /><div><span className="eyebrow">LEARN & GROW</span><h2>Knowledge that moves agriculture forward.</h2><p>Explore farmer training and capacity-building opportunities in climate-smart farming, agribusiness and modern agricultural practice.</p><Link className="text-link" to="/training">Explore training programmes <ArrowRight size={16} /></Link></div></div></section>
    <section className="insight-preview section-pad"><div className="wrap insight-grid"><div><span className="eyebrow">KNOWLEDGE CENTRE</span><h2>Fresh thinking for the field.</h2><p>Explore useful agricultural ideas, practical guidance and emerging opportunities. Articles are added as they are reviewed and published.</p><Link className="text-link" to="/resources">Visit resources <ArrowRight size={16} /></Link></div><div className="insight-visual" style={{ backgroundImage: `url(${photos.field})` }}><div className="insight-chip"><BookOpen size={16} /> Ideas for resilient agriculture</div></div></div></section>
    <section className="cta-section"><div className="wrap cta-inner"><div><span className="eyebrow eyebrow-light">LET'S TALK</span><h2>Have a challenge in the field?<br />Let's work through it together.</h2></div><Link className="button button-light" to="/contact?type=consultation">Start a conversation <ArrowUpRight size={17} /></Link></div></section>
  </>;
}

function PageHero({ eyebrow, title, text, image = photos.field }) {
  const titleLines = title.split(/<br\s*\/?>/i);
  return <section className="page-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(13,49,35,.89), rgba(13,49,35,.48)), url(${image})` }}><div className="wrap"><span className="eyebrow eyebrow-light">{eyebrow}</span><h1>{titleLines.map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><p>{text}</p><div className="breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} />{eyebrow}</div></div></section>;
}

function About() {
  return <><PageMeta title="About us" description="Learn about FEDUWO AGRI CONSULTANT's practical approach to agricultural consultancy, training and sustainable development in Kenya." /><PageHero eyebrow="ABOUT US" title="Rooted in purpose.<br />Growing together." text="We believe stronger agricultural outcomes are built through practical expertise, shared learning and sustainable choices." image={photos.crops} />
    <section className="section-pad"><div className="wrap split-section"><div><span className="eyebrow">WHO WE ARE</span><h2>Supporting the people behind agriculture.</h2><p>FEDUWO AGRI CONSULTANT is an agricultural consultancy serving farmers, agricultural professionals, agribusinesses, institutions and organizations across Kenya.</p><p>We bring advisory, staffing and capacity-building services together to help clients respond to real production and business needs. Our work is shaped by the understanding that every context is different—and recommendations must be practical to be useful.</p></div><img className="rounded-image" src={photos.farm} alt="Cultivated land and agricultural production" loading="lazy" /></div></section>
    <section className="values-section section-pad"><div className="wrap"><SectionHeading eyebrow="OUR PURPOSE" title="Principles that guide our work" /><div className="values-grid"><article><span>01</span><h3>Our mission</h3><p>To empower agricultural stakeholders through practical consultancy, professional staffing and relevant training that supports sustainable growth.</p></article><article><span>02</span><h3>Our vision</h3><p>A resilient, productive and inclusive agricultural sector where people and businesses can thrive.</p></article><article><span>03</span><h3>Our values</h3><p>Integrity, collaboration, practical knowledge, sustainability and respect for the communities and ecosystems we serve.</p></article></div></div></section>
    <section className="section-pad"><div className="wrap split-section reverse"><img className="rounded-image" src={photos.soil} alt="Healthy green plants growing in rich soil" loading="lazy" /><div><span className="eyebrow">HOW WE WORK</span><h2>Local context. Practical action. Lasting value.</h2><p>We start by understanding each client's operating environment, ambitions and available resources. Together, we identify opportunities, set achievable priorities and focus on steps that can be sustained over time.</p><ul className="check-list"><li><Check /> Recommendations grounded in your needs</li><li><Check /> Responsible use of natural resources</li><li><Check /> Knowledge sharing and capacity building</li><li><Check /> Clear communication and collaboration</li></ul></div></div></section>
    <section className="values-section section-pad"><div className="wrap"><SectionHeading eyebrow="OUR STRATEGIC OBJECTIVES" title="Turning our purpose into practical priorities" text="Our objectives are to strengthen agricultural productivity, build relevant skills, promote sustainable resource use and support resilient farm enterprises."/><Link className="text-link" to="/services">See how we support these priorities <ArrowRight size={16}/></Link></div></section>
    <section className="placeholder-note"><div className="wrap"><strong>Leadership & experience</strong><p>Verified leadership biographies, registrations and organizational milestones will be published here once confirmed by the company.</p></div></section>
  </>;
}

function Services() {
  return <><PageMeta title="Agricultural services" description="Explore agricultural consultancy, farm management, soil and water, crop protection, livestock, staffing, farmer training and agribusiness services in Kenya." /><PageHero eyebrow="OUR SERVICES" title="Practical expertise<br />for a changing sector." text="Integrated agricultural services to support stronger farms, skilled teams and resilient agribusinesses." image={photos.field} />
    <section className="section-pad services-directory"><div className="wrap"><SectionHeading eyebrow="HOW WE CAN HELP" title="Support built around your needs" text="Choose a service to learn how we can work together. Each engagement begins with a conversation about your priorities."/><div className="services-list">{services.map((service, i) => <article className="service-row" key={service.title}><div className="service-row-icon"><service.icon size={24} /></div><div><span className="eyebrow">0{i + 1} / SERVICE</span><h2>{service.title}</h2><p>{service.text}</p><div className="service-detail"><strong>What it can include</strong><span>{service.details}</span></div><div className="service-benefit"><strong>Client benefit</strong><span>{service.benefit}</span></div><Link className="text-link" to={`/contact?service=${encodeURIComponent(service.title)}`}>Request this service <ArrowRight size={16}/></Link></div><Link className="round-link" aria-label={`Request ${service.title}`} to={`/contact?service=${encodeURIComponent(service.title)}`}><ArrowUpRight /></Link></article>)}</div></div></section>
    <div className="cta-section"><div className="wrap cta-inner"><div><h2>Not sure where to start?</h2><p>Tell us what you're working on and we'll help direct your enquiry.</p></div><Link className="button button-light" to="/contact?type=consultation">Request a consultation <ArrowRight size={16} /></Link></div></div>
  </>;
}

function Training() {
  const programs = [
    ["Climate-smart agriculture", "Explore practical options for building farm resilience and adapting production to changing conditions.", "Farmers, producer groups and agricultural teams"],
    ["Agribusiness essentials", "Strengthen business planning, record-keeping and decision-making for agricultural enterprises.", "Farm entrepreneurs and agribusiness owners"],
    ["Modern crop production", "Build knowledge of crop planning, soil health and good production practices.", "Farmers and agricultural professionals"],
  ];
  return <><PageMeta title="Farmer training" description="Register your interest in climate-smart agriculture, agribusiness and crop production training with FEDUWO AGRI CONSULTANT."/><PageHero eyebrow="FARMER TRAINING" title="Knowledge for a<br />stronger harvest." text="Practical capacity building for farmers, teams and agricultural professionals." image={photos.training} />
    <section className="section-pad"><div className="wrap"><SectionHeading eyebrow="LEARN WITH US" title="Training areas" text="Programmes are developed around practical learning needs. Submit an expression of interest and we'll share details when schedules are confirmed."/><div className="program-grid">{programs.map(([name, text, audience], index) => <article className="program-card" key={name}><span className="program-number">0{index + 1}</span><div className="icon-box"><BookOpen /></div><h3>{name}</h3><p>{text}</p><div className="program-audience"><strong>For</strong><span>{audience}</span></div><Link className="text-link" to={`/contact?training=${encodeURIComponent(name)}`}>Register your interest <ArrowRight size={16}/></Link></article>)}</div><TrainingProgrammeRegistration /></div></section>
    <section className="training-info"><div className="wrap split-section"><div><span className="eyebrow eyebrow-light">PROGRAMME INFORMATION</span><h2>Focused on learning you can put to work.</h2><p>Programme schedules, delivery formats and fees are confirmed directly with participants as opportunities become available. We do not advertise unconfirmed dates.</p><Link className="button button-light" to="/contact?type=training">Ask about training <ArrowRight size={16} /></Link></div><div className="training-checks">{["Facilitated, practical learning", "Relevant agricultural topics", "Programmes for individuals and groups", "Resources shared when available"].map(item => <p key={item}><Check size={18}/>{item}</p>)}</div></div></section>
    <section className="section-pad"><div className="wrap faq-wrap"><SectionHeading eyebrow="GOOD TO KNOW" title="Training FAQs"/>{[["How do I register?", "Use the registration of interest form on our contact page. We'll get in touch with available programme details."],["Are programme dates confirmed?", "Dates and locations are shared directly once a programme is scheduled. No dates are listed until confirmed."],["Can an organization request a group session?", "Yes. Share the topic, participant group and preferred location in your enquiry so we can discuss your needs."]].map(([q,a]) => <details className="faq-item" key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}</div></section>
  </>;
}

function TrainingProgrammeRegistration() {
  const [programmes, setProgrammes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ programme: "", name: "", email: "", phone: "", location: "" });
  useEffect(() => { api.get("/training").then(({ data }) => setProgrammes(data)).catch(() => setError("Scheduled programmes could not be loaded.")); }, []);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage(""); setSubmitting(true);
    try { await api.post("/training/register", form); setMessage("Your registration has been received."); setForm({ programme: "", name: "", email: "", phone: "", location: "" }); }
    catch (err) { setError(err.response?.data?.message || "Registration could not be submitted. Please try again."); }
    finally { setSubmitting(false); }
  };
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!programmes.length) return null;
  return <div className="published-programmes"><SectionHeading eyebrow="CONFIRMED SCHEDULES" title="Available programmes" text="The programmes below have been published by our team."/><div className="program-grid">{programmes.map((program) => <article className="program-card" key={program._id}><span className="eyebrow">{program.category || "TRAINING"}</span><h3>{program.title}</h3><p>{program.description}</p>{program.objectives?.length > 0 && <ul className="check-list">{program.objectives.map((objective) => <li key={objective}><Check/>{objective}</li>)}</ul>}<div className="program-audience"><strong>For</strong><span>{program.targetParticipants || "Farmers and agricultural professionals"}</span></div>{program.schedule && <p className="programme-meta"><strong>Schedule:</strong> {program.schedule}</p>}{program.location && <p className="programme-meta"><strong>Location:</strong> {program.location}</p>}{program.resources?.length > 0 && <div className="programme-resources"><strong>Resources</strong>{program.resources.map((resource) => <a href={resource.url} key={resource.url} target="_blank" rel="noreferrer">{resource.title} <ArrowUpRight size={14}/></a>)}</div>}</article>)}</div><div className="training-registration"><div><span className="eyebrow">REGISTRATION</span><h3>Register for a programme</h3><p>Our team will follow up with registration details.</p></div><form onSubmit={submit}><label className="form-field">Programme<select name="programme" value={form.programme} onChange={update} required><option value="">Select a programme</option>{programmes.map((program) => <option value={program._id} key={program._id}>{program.title}</option>)}</select></label><div className="form-row"><label className="form-field">Full name<input name="name" value={form.name} onChange={update} required /></label><label className="form-field">Email<input type="email" name="email" value={form.email} onChange={update} required /></label></div><div className="form-row"><label className="form-field">Phone<input name="phone" value={form.phone} onChange={update} required /></label><label className="form-field">Location<input name="location" value={form.location} onChange={update} /></label></div>{error && <p className="form-error">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button className="button button-dark" disabled={submitting}>{submitting ? "Submitting..." : "Register"} <ArrowRight size={16}/></button></form></div></div>;
}

function JobApplicationForm({ job, onClose }) {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    const formData = new FormData(event.currentTarget);
    try { await api.post(`/jobs/${job._id}/applications`, formData); setSent(true); }
    catch (err) { setError(err.response?.data?.message || "Your application could not be submitted."); }
    finally { setBusy(false); }
  };
  if (sent) return <div className="application-form"><p className="form-success" role="status">Your application for {job.title} has been received.</p><button className="text-link" onClick={onClose}>Close</button></div>;
  return <form className="application-form" onSubmit={submit}><div className="form-row"><label className="form-field">Full name<input name="name" required maxLength={120}/></label><label className="form-field">Email<input name="email" type="email" required maxLength={254}/></label></div><label className="form-field">Phone<input name="phone" required maxLength={30}/></label><label className="form-field">Cover letter<textarea name="coverLetter" rows="3" maxLength={5000}/></label><label className="form-field">CV / resume (PDF, DOC, DOCX — combined documents max 4 MB)<input name="resume" type="file" accept=".pdf,.doc,.docx" required /></label><label className="form-field">Academic / professional qualifications (optional)<input name="qualifications" type="file" accept=".pdf,.doc,.docx" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark" disabled={busy}>{busy ? "Submitting..." : "Submit application"} <ArrowRight size={16}/></button></form>;
}

function Careers() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [applyingTo, setApplyingTo] = useState("");
  useEffect(() => { api.get("/jobs").then(({ data }) => setJobs(data)).catch(() => setError("Current opportunities could not be loaded. Please try again later.")); }, []);
  return <><PageMeta title="Staffing & careers" description="Agricultural recruitment and staffing services connecting organizations with agricultural professionals in Kenya."/><PageHero eyebrow="STAFFING & CAREERS" title="Connecting talent<br />with opportunity." text="Agricultural recruitment and workforce solutions for organizations building the future of food and farming." image={photos.crops}/>
    <section className="section-pad"><div className="wrap careers-intro"><div><span className="eyebrow">AGRICULTURAL STAFFING</span><h2>The right people make growth possible.</h2><p>We support recruitment and workforce placement across agronomy, farm management, extension, livestock and agricultural research. Organizations can share their staffing needs; candidates can submit their profiles for consideration.</p><Link className="button button-dark" to="/contact?type=recruitment">Discuss a staffing need <ArrowRight size={16}/></Link></div><div className="career-categories">{["Agronomists", "Agricultural officers", "Farm managers", "Livestock technicians", "Extension officers", "Agricultural researchers"].map((item) => <span key={item}><Check size={15}/>{item}</span>)}</div></div></section>
    <section className="jobs-section section-pad"><div className="wrap"><SectionHeading eyebrow="CAREER OPPORTUNITIES" title="Current openings" text="Only verified and active vacancies are listed here."/><div className="job-list">{error && <p className="form-error">{error}</p>}{jobs.length === 0 && !error && <div className="empty-state"><Users size={24}/><h3>No vacancies listed right now</h3><p>We don't have a confirmed opening to display. Check back later or share your profile with us.</p><Link className="text-link" to="/contact?type=career">Submit your interest <ArrowRight size={16}/></Link></div>}{jobs.map((job) => <div key={job._id}><article className="job-card"><div><span className="eyebrow">{job.category || "AGRICULTURE"}</span><h3>{job.title}</h3><p>{job.location || "Kenya"} · Deadline {job.deadline ? new Date(job.deadline).toLocaleDateString() : "To be confirmed"}</p></div><button className="button button-dark" onClick={() => setApplyingTo(applyingTo === job._id ? "" : job._id)}>{applyingTo === job._id ? "Close application" : "Apply now"} <ArrowUpRight size={16}/></button></article>{applyingTo === job._id && <JobApplicationForm job={job} onClose={() => setApplyingTo("")}/>}</div>)}</div></div></section>
    <div className="placeholder-note"><div className="wrap"><strong>Applying for a listed position?</strong><p>Contact us to receive the secure application process. Do not send sensitive documents by email unless requested through an approved channel.</p></div></div>
  </>;
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/projects").then(({ data }) => setProjects(data)).catch(() => setError("Projects could not be loaded. Please try again later.")); }, []);
  return <><PageMeta title="Projects" description="Learn about FEDUWO AGRI CONSULTANT's agricultural projects. Verified project details will be published as they become available."/><PageHero eyebrow="PROJECTS" title="Better agriculture,<br />built together." text="Our portfolio showcases verified agricultural initiatives, partnerships and outcomes." image={photos.farm}/>
    <section className="section-pad"><div className="wrap projects-intro"><SectionHeading eyebrow="OUR PORTFOLIO" title="Work that makes a difference" text="Project information is published only after details and outcomes have been confirmed." />{error && <p className="form-error">{error}</p>}{projects.length ? <div className="article-grid">{projects.map((project) => <article className="article-card" key={project._id}><div className="article-image" style={{ backgroundImage: `url(${project.images?.[0] || photos.field})` }} /><div className="article-content"><span className="eyebrow">{project.category || "AGRICULTURE"} · {project.location || "Kenya"}</span><h3>{project.title}</h3><p>{project.description}</p>{project.outcomes && <p>{project.outcomes}</p>}</div></article>)}</div> : !error && <div className="portfolio-empty"><img src={photos.soil} alt="Young plants thriving in healthy soil" loading="lazy"/><div><span className="eyebrow">PORTFOLIO IN DEVELOPMENT</span><h2>Verified stories are coming.</h2><p>Project profiles will be added when confirmed information and permissions are available. We won't publish sample results as company achievements.</p><Link className="text-link" to="/contact">Talk to our team <ArrowRight size={16}/></Link></div></div>}</div></section>
  </>;
}

function Resources() {
  const { slug } = useParams();
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [article, setArticle] = useState(null);
  useEffect(() => {
    if (!slug) return;
    let active = true;
    setError(""); setArticle(null);
    api.get(`/articles/${encodeURIComponent(slug)}`).then(({ data }) => { if (active) setArticle(data); }).catch(() => { if (active) setError("This article could not be found."); });
    return () => { active = false; };
  }, [slug]);
  useEffect(() => {
    if (slug) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      api.get("/articles", { params: query ? { q: query } : {} }).then(({ data }) => { if (active) setArticles(data); }).catch(() => { if (active) setError("Articles could not be loaded. Please try again later."); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, slug]);
  const categories = [...new Set(articles.map((item) => item.category).filter(Boolean))];
  const filtered = articles.filter((item) => !category || item.category === category);
  if (slug) return <><PageMeta title={article?.title || "Article"} description={article?.excerpt || "Agricultural insight from FEDUWO AGRI CONSULTANT."}/><PageHero eyebrow={article?.category || "AGRICULTURAL INSIGHT"} title={article?.title || (error ? "Article not found" : "Loading article")} text={article?.excerpt || ""} image={article?.image || photos.field}/><section className="section-pad"><article className="wrap legal-copy article-body"><p className="article-byline">{article?.author || "FEDUWO AGRI CONSULTANT"}{article?.publishedAt && ` · ${new Date(article.publishedAt).toLocaleDateString()}`}</p>{error ? <p className="form-error">{error}</p> : article ? <><div className="article-body-copy">{article.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><div className="article-sharing"><span>Share this article</span><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">LinkedIn</a><a href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${window.location.href}`)}`} target="_blank" rel="noreferrer">WhatsApp</a></div><Link className="text-link" to="/resources">Back to resources <ArrowRight size={16}/></Link></> : <p>Loading article…</p>}</article></section></>;
  return <><PageMeta title="Agricultural resources" description="Explore agricultural insights and information from FEDUWO AGRI CONSULTANT's knowledge centre."/><PageHero eyebrow="RESOURCES" title="Ideas and insight<br />for the field." text="A knowledge centre for agricultural practice, innovation and enterprise." image={photos.field}/>
    <section className="section-pad"><div className="wrap"><div className="resource-top"><div><span className="eyebrow">KNOWLEDGE CENTRE</span><h2>Explore agricultural insights</h2></div><div className="resource-filters"><label className="search-box"><span className="sr-only">Search articles</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources..." /><BookOpen size={18}/></label><label className="sr-only" htmlFor="article-category">Filter by category</label><select id="article-category" className="category-select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div>{error && <p className="form-error">{error}</p>}{loading ? <div className="loading-state">Searching articles…</div> : filtered.length === 0 && !error ? <div className="empty-state"><BookOpen size={24}/><h3>{query || category ? "No matching articles" : "Resources are being prepared"}</h3><p>{query || category ? "Try another search or category." : "Reviewed and published agricultural insights will appear here. Check back soon."}</p></div> : <div className="article-grid">{filtered.map((article) => <article className="article-card" key={article._id}><div className="article-image" style={{ backgroundImage: `url(${article.image || photos.field})` }}></div><div className="article-content"><span className="eyebrow">{article.category || "AGRICULTURE"} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}</span><h3>{article.title}</h3><p>{article.excerpt}</p><Link className="text-link" to={`/resources/${article.slug}`}>Read article <ArrowRight size={16}/></Link></div></article>)}</div>}</div></section>
  </>;
}

function Field({ label, name, register, errors, required, as, children, ...props }) {
  const rules = { required: required ? `${label} is required` : false, ...(props.type === "email" ? { pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } } : {}) };
  const controlProps = { ...register(name, rules), ...props, id: name, required, "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined };
  const control = as === "textarea" ? <textarea {...controlProps} /> : as === "select" ? <select {...controlProps}>{children}</select> : <input {...controlProps} />;
  return <label className="form-field">{label}{required && <span className="required-mark"> *</span>}{control}{errors[name] && <small id={`${name}-error`} className="field-error">{errors[name].message}</small>}</label>;
}

function ContactForm() {
  const [params] = useSearchParams();
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { service: params.get("service") || params.get("training") || params.get("job") || "", type: params.get("type") || "enquiry", consultationMethod: params.get("type") === "consultation" ? "Online consultation" : "" } });
  const selectedType = watch("type");
  const onSubmit = async (values) => {
    setApiError("");
    try {
      const { type, ...data } = values;
      await api.post(type === "consultation" ? "/consultations" : "/enquiries", { ...data, type });
      setSent(true);
    } catch (error) {
      setApiError(error.response?.data?.message || "Your message couldn't be submitted. Please try again shortly.");
    }
  };
  if (sent) return <div className="success-panel" role="status"><div><Check size={22}/></div><h2>Thank you for reaching out.</h2><p>Your enquiry has been received. Our team will be in touch using the details you provided.</p><Link className="text-link" to="/">Return to home <ArrowRight size={16}/></Link></div>;
  return <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
    <div className="form-row"><Field label="Full name" name="name" register={register} errors={errors} required autoComplete="name" placeholder="Your name"/><Field label="Email address" name="email" type="email" register={register} errors={errors} required autoComplete="email" placeholder="you@example.com"/></div>
    <div className="form-row"><Field label="Phone number" name="phone" type="tel" register={register} errors={errors} placeholder="+254 ..."/><Field label="Organization (optional)" name="organization" register={register} errors={errors} placeholder="Farm or organization"/></div>
    <Field label="How can we help?" name="type" as="select" register={register} errors={errors}><option value="enquiry">General enquiry</option><option value="consultation">Request a consultation</option><option value="training">Training interest</option><option value="recruitment">Staffing enquiry</option><option value="career">Career interest</option></Field>
    <Field label="Service or topic" name="service" register={register} errors={errors} placeholder="Select a service or describe your topic"/>
    <div className="form-row"><Field label="Farm or business location" name="location" register={register} errors={errors} placeholder="County / town"/><Field label="Preferred consultation method" name="consultationMethod" as="select" required={selectedType === "consultation"} register={register} errors={errors}><option value="">Choose if applicable</option><option>Physical farm visit</option><option>Online consultation</option><option>Telephone consultation</option><option>Office appointment</option></Field></div>
    <Field label="Tell us more" name="message" as="textarea" register={register} errors={errors} required placeholder="Share your goals, questions or agricultural challenge..." rows={5}/>
    <p className="privacy-hint">By submitting, you agree that we may use these details to respond to your enquiry. Please don't include sensitive personal information.</p>
    {apiError && <p className="form-error" role="alert">{apiError}</p>}
    <button className="button button-dark submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send your enquiry"} <ArrowRight size={17}/></button>
  </form>;
}

function Contact() {
  return <><PageMeta title="Contact us" description="Contact FEDUWO AGRI CONSULTANT for agricultural consultancy, training, staffing and agribusiness support in Kenya."/><PageHero eyebrow="CONTACT" title="Let's start a<br />conversation." text="Tell us what you're working on. We would be glad to hear from you." image={photos.hands}/>
    <section className="section-pad"><div className="wrap contact-layout"><div className="contact-info"><span className="eyebrow">GET IN TOUCH</span><h2>Here to help you move forward.</h2><p>Reach out for a consultation, a training enquiry or to discuss agricultural staffing and partnership opportunities.</p><div className="contact-method"><div className="icon-box"><Phone/></div><div><small>CALL US</small><a href="tel:+254114110603">+254 114 110 603</a></div></div><div className="contact-method"><div className="icon-box"><Mail/></div><div><small>EMAIL</small><a href="mailto:feduwofelix@gmail.com">feduwofelix@gmail.com</a></div></div><div className="contact-method"><div className="icon-box"><MessageIcon/></div><div><small>WHATSAPP</small><a href="https://wa.me/254114110603" target="_blank" rel="noreferrer">Message us on WhatsApp</a></div></div><div className="contact-method"><div className="icon-box"><Linkedin/></div><div><small>LINKEDIN</small><a href="https://www.linkedin.com/groups/9890337" target="_blank" rel="noreferrer">FEDUWO AGRI CONSULTANT</a></div></div><p className="location-note">Serving clients across Kenya. Meeting location and availability are confirmed when we respond to your enquiry.</p></div>
      <div className="form-card"><h2>Send us a message</h2><p>We typically respond directly using the contact details you provide.</p><ContactForm/></div></div></section>
  </>;
}

function MessageIcon() { return <Phone size={20} />; }

function Admin() {
  const [token, setToken] = useState(localStorage.getItem("feduwo-admin-token") || "");
  const [role, setRole] = useState(localStorage.getItem("feduwo-admin-role") || "");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = async (event) => {
    event.preventDefault(); setError("");
    try { const { data } = await api.post("/auth/login", { email, password }); localStorage.setItem("feduwo-admin-token", data.token); localStorage.setItem("feduwo-admin-role", data.user.role); setRole(data.user.role); setToken(data.token); }
    catch (err) { setError(err.response?.data?.message || "Unable to sign in. Check your credentials and try again."); }
  };
  useEffect(() => {
    if (!token) return;
    api.get("/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setStats(data))
      .catch((err) => { setError(err.response?.data?.message || "Dashboard data could not be loaded."); if (err.response?.status === 401) { localStorage.removeItem("feduwo-admin-token"); localStorage.removeItem("feduwo-admin-role"); setToken(""); setRole(""); } });
  }, [token]);
  const logout = () => { localStorage.removeItem("feduwo-admin-token"); localStorage.removeItem("feduwo-admin-role"); setToken(""); setRole(""); setStats(null); };
  return <><PageMeta title="Administrator" description="Secure FEDUWO AGRI CONSULTANT administration portal."/><PageHero eyebrow="ADMINISTRATION" title="Management portal" text="Authorized access only."/><section className="section-pad"><div className="wrap admin-wrap">{!token ? <form className="login-card" onSubmit={login}><span className="eyebrow">SECURE SIGN IN</span><h2>Administrator login</h2><label className="form-field">Email address<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="username"/></label><label className="form-field">Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="current-password"/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit">Sign in <ArrowRight size={16}/></button><p className="privacy-hint">Admin account setup is managed through the server environment. Public sign-up is disabled.</p></form> : <div className="dashboard"><div className="dashboard-heading"><div><span className="eyebrow">OVERVIEW · {role}</span><h2>Dashboard</h2></div><button className="button button-outline-dark" onClick={logout}>Sign out</button></div>{error && <p className="form-error">{error}</p>}{!stats ? <div className="loading-state">Loading live records…</div> : <><div className="stats-grid">{Object.entries(stats.counts || {}).map(([label, count])=><div className="stat-card" key={label}><span>{label.replace(/([A-Z])/g," $1")}</span><strong>{count}</strong></div>)}</div><div className="dashboard-table"><h3>Recent enquiries</h3>{stats.recentEnquiries?.length ? stats.recentEnquiries.map(item=><div className="dashboard-row" key={item._id}><div><strong>{item.name}</strong><span>{item.email} · {item.subject || item.type || "Enquiry"}</span></div><span className="status-pill">{item.status || "New"}</span></div>) : <p className="empty-copy">No enquiries received yet.</p>}</div><div className="dashboard-table"><h3>Recent activity</h3>{stats.recentActivities?.length ? stats.recentActivities.map(item=><div className="dashboard-row" key={item._id}><div><strong>{item.action}</strong><span>{item.resource || "Platform"} · {new Date(item.createdAt).toLocaleString()}</span></div></div>) : <p className="empty-copy">No administrative activity recorded.</p>}</div><AdminRecords token={token} role={role}/><p className="privacy-hint">Dashboard counts reflect live database records. Applicant documents are private and available only to authorized administrators.</p></>}</div>}</div></section></>;
}

const adminModules = [
  ["consultations", "Consultations"], ["enquiries", "Contact enquiries"], ["training", "Training programmes"],
  ["registrations", "Training registrations"], ["jobs", "Job vacancies"], ["applications", "Job applications"],
  ["articles", "Articles"], ["projects", "Projects"], ["subscribers", "Newsletter subscribers"], ["users", "Users"],
];
const editorFields = {
  training: [["title", "Programme title", "text"], ["description", "Description", "textarea"], ["objectives", "Learning objectives (one per line)", "textarea"], ["category", "Category", "text"], ["targetParticipants", "Target participants", "text"], ["schedule", "Schedule", "text"], ["location", "Location", "text"], ["resources", "Resources (one title | https://URL per line)", "textarea"]],
  jobs: [["title", "Job title", "text"], ["description", "Description", "textarea"], ["category", "Category", "text"], ["location", "Location", "text"], ["qualifications", "Qualifications", "textarea"], ["experience", "Experience", "text"], ["deadline", "Deadline", "date"]],
  articles: [["title", "Title", "text"], ["slug", "URL slug", "text"], ["excerpt", "Excerpt", "textarea"], ["body", "Article body", "textarea"], ["category", "Category", "text"], ["author", "Author", "text"], ["image", "Image URL", "url"]],
  projects: [["title", "Project title", "text"], ["description", "Description", "textarea"], ["category", "Category", "text"], ["location", "Location", "text"], ["outcomes", "Verified outcomes", "textarea"]],
};

function AdminRecords({ token, role }) {
  const [resource, setResource] = useState(role === "editor" ? "articles" : "consultations");
  const [records, setRecords] = useState([]);
  const [team, setTeam] = useState([]);
  const [form, setForm] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };
  const load = () => {
    setError("");
    const endpoint = resource === "users" ? "/admin/users" : `/admin/${resource}`;
    api.get(endpoint, { headers }).then(({ data }) => setRecords(data)).catch((err) => setError(err.response?.data?.message || "Records could not be loaded."));
  };
  useEffect(() => { load(); }, [resource, token]);
  useEffect(() => {
    if (role !== "admin") return;
    api.get("/admin/users", { headers }).then(({ data }) => setTeam(data.filter((user) => user.active && ["admin", "consultant"].includes(user.role)))).catch((err) => setError(err.response?.data?.message || "Team accounts could not be loaded."));
  }, [role, token]);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      const payload = { ...form };
      if (resource === "articles") { payload.published = true; payload.publishedAt = new Date().toISOString(); }
      if (resource === "training") {
        payload.published = true;
        payload.objectives = (payload.objectives || "").split("\n").map((item) => item.trim()).filter(Boolean);
        payload.resources = (payload.resources || "").split("\n").map((item) => {
          const [title, url] = item.split("|").map((part) => part.trim());
          return title && url ? { title, url } : null;
        }).filter(Boolean);
      }
      if (resource === "jobs") payload.published = true;
      if (resource === "projects") { payload.images = (payload.images || "").split(",").map((item) => item.trim()).filter(Boolean); payload.published = true; }
      if (resource === "users") payload.active = true;
      await api.post(`/admin/${resource}`, payload, { headers });
      setForm({}); setNotice("Record saved."); load();
    } catch (err) { setError(err.response?.data?.message || "The record could not be saved."); }
    finally { setBusy(false); }
  };
  const togglePublished = async (record) => {
    setError(""); setNotice("");
    try { await api.patch(`/admin/${resource}/${record._id}`, { published: !record.published }, { headers }); setNotice("Publication status updated."); load(); }
    catch (err) { setError(err.response?.data?.message || "The record could not be updated."); }
  };
  const changeStatus = async (record, status) => {
    setError(""); setNotice("");
    try { await api.patch(`/admin/${resource}/${record._id}`, { status }, { headers }); setNotice("Status updated."); load(); }
    catch (err) { setError(err.response?.data?.message || "The status could not be updated."); }
  };
  const updateUser = async (record, changes) => {
    setError(""); setNotice("");
    try { await api.patch(`/admin/users/${record._id}`, changes, { headers }); setNotice("User account updated."); load(); }
    catch (err) { setError(err.response?.data?.message || "The user account could not be updated."); }
  };
  const updateAssignment = async (record, assignedTo) => {
    setError(""); setNotice("");
    try { await api.patch(`/admin/consultations/${record._id}`, { assignedTo: assignedTo || null }, { headers }); setNotice("Consultant assignment updated."); load(); }
    catch (err) { setError(err.response?.data?.message || "The consultant could not be assigned."); }
  };
  const editInternalNote = async (record) => {
    const internalNotes = window.prompt("Internal consultation note", record.internalNotes || "");
    if (internalNotes === null) return;
    setError(""); setNotice("");
    try { await api.patch(`/admin/consultations/${record._id}`, { internalNotes }, { headers }); setNotice("Internal note saved."); load(); }
    catch (err) { setError(err.response?.data?.message || "The internal note could not be saved."); }
  };
  const toggleVerified = async (record) => {
    setError(""); setNotice("");
    try { await api.patch(`/admin/projects/${record._id}`, { verified: !record.verified }, { headers }); setNotice("Project verification updated."); load(); }
    catch (err) { setError(err.response?.data?.message || "The project could not be updated."); }
  };
  const exportCsv = () => {
    if (!records.length) { setNotice("There are no records to export."); return; }
    const columns = [...new Set(records.flatMap((record) => Object.entries(record).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value)).map(([key]) => key)))];
    const quote = (value) => {
      let text = value == null ? "" : String(value);
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const content = [columns.map(quote).join(","), ...records.map((record) => columns.map((column) => quote(record[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${resource}-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("CSV export downloaded.");
  };
  const downloadDocument = async (record, documentInfo) => {
    setError("");
    try {
      const { data } = await api.get(`/admin/applications/${record._id}/documents/${encodeURIComponent(documentInfo.filename)}`, { headers, responseType: "blob" });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = documentInfo.originalName; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.response?.data?.message || "The private document could not be downloaded."); }
  };
  const remove = async (record) => {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    setError(""); setNotice("");
    try { await api.delete(`/admin/${resource}/${record._id}`, { headers }); setNotice("Record deleted."); load(); }
    catch (err) { setError(err.response?.data?.message || "The record could not be deleted."); }
  };
  const statusOptions = resource === "consultations" ? ["Pending", "Under Review", "Approved", "In Progress", "Completed", "Rejected"] : resource === "enquiries" ? ["New", "In Progress", "Resolved"] : resource === "jobs" ? ["Open", "Closed"] : resource === "registrations" ? ["Received", "Contacted", "Confirmed", "Declined"] : resource === "applications" ? ["Received", "Under Review", "Shortlisted", "Rejected", "Hired"] : [];
  const accessibleModules = adminModules.filter(([value]) => role === "admin" || (role === "consultant" && ["consultations", "enquiries", "training", "registrations", "jobs", "applications"].includes(value)) || (role === "editor" && ["articles", "projects"].includes(value)));
  return <section className="admin-records"><div className="admin-records-heading"><div><span className="eyebrow">MANAGE RECORDS</span><h3>Platform modules</h3></div><label className="admin-module-select">Module<select value={resource} onChange={(event) => setResource(event.target.value)}>{accessibleModules.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    {editorFields[resource] && <form className="admin-create-form" onSubmit={submit}><h4>Create {adminModules.find(([value]) => value === resource)?.[1].toLowerCase()}</h4><div className="form-row">{editorFields[resource].map(([key, label, type]) => <label className="form-field" key={key}>{label}{type === "textarea" ? <textarea value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={["title", "description", "body", "slug"].includes(key)} rows={3}/> : <input type={type} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={["title", "slug"].includes(key)}/>}</label>)}{resource === "projects" && <label className="form-field">Image URLs (comma separated)<input value={form.images || ""} onChange={(event) => setForm({ ...form, images: event.target.value })} /></label>}</div><button className="button button-dark" disabled={busy}>{busy ? "Saving..." : "Create record"} <ArrowRight size={16}/></button></form>}
    {resource === "users" && role === "admin" && <form className="admin-create-form" onSubmit={submit}><h4>Add an administrator or team member</h4><div className="form-row"><label className="form-field">Full name<input value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label className="form-field">Email<input type="email" value={form.email || ""} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label className="form-field">Temporary password (min. 12 characters)<input type="password" value={form.password || ""} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={12} required /></label><label className="form-field">Role<select value={form.role || "consultant"} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="admin">Admin</option><option value="consultant">Consultant</option><option value="editor">Editor</option><option value="farmer">Farmer</option></select></label></div><button className="button button-dark" disabled={busy}>Add account <ArrowRight size={16}/></button></form>}
    <button className="button button-outline-dark csv-button" onClick={exportCsv}>Export current records to CSV</button>
    <div className="admin-record-list">{records.length === 0 ? <p className="empty-copy">No records in this module yet.</p> : records.map((record) => <article className="admin-record-item" key={record._id}><div><strong>{record.title || record.name || record.email || record.action || "Record"}</strong><span>{record.email || record.category || record.type || record.createdAt && new Date(record.createdAt).toLocaleDateString() || record._id}</span>{resource === "applications" && record.documents?.map((document) => <button className="record-document" key={document.filename} onClick={() => downloadDocument(record, document)}>Download {document.originalName}</button>)}</div><div className="record-actions">{resource === "users" && <><select aria-label={`Update role for ${record.name}`} value={record.role} onChange={(event) => updateUser(record, { role: event.target.value })}><option value="admin">Admin</option><option value="consultant">Consultant</option><option value="editor">Editor</option><option value="farmer">Farmer</option></select><button className="status-pill" onClick={() => updateUser(record, { active: !record.active })}>{record.active ? "Active" : "Deactivated"}</button></>}{Object.hasOwn(record, "published") && <button className="status-pill" onClick={() => togglePublished(record)}>{record.published ? "Published" : "Unpublished"}</button>}{resource === "projects" && <button className="status-pill" onClick={() => toggleVerified(record)}>{record.verified ? "Verified" : "Unverified"}</button>}{resource === "consultations" && role === "admin" && <select aria-label={`Assign consultant for ${record.name}`} value={record.assignedTo?._id || record.assignedTo || ""} onChange={(event) => updateAssignment(record, event.target.value)}><option value="">Unassigned</option>{team.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}</select>}{resource === "consultations" && ["admin", "consultant"].includes(role) && <button className="status-pill" onClick={() => editInternalNote(record)}>{record.internalNotes ? "Edit note" : "Add note"}</button>}{statusOptions.length > 0 && <select aria-label={`Update status for ${record.name || record.title || "record"}`} value={record.status} onChange={(event) => changeStatus(record, event.target.value)}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select>}{role === "admin" && !["applications", "registrations", "activities", "users"].includes(resource) && <button className="delete-record" onClick={() => remove(record)}>Delete</button>}</div></article>)}</div>
  </section>;
}

function Legal({ terms = false }) {
  const title = terms ? "Terms of use" : "Privacy notice";
  return <><PageMeta title={title} description={`${title} for FEDUWO AGRI CONSULTANT.`}/><PageHero eyebrow="INFORMATION" title={title} text="Clear information about using our website and contacting our team."/><section className="section-pad"><div className="wrap legal-copy"><h2>{terms ? "Using this website" : "How we handle your information"}</h2>{terms ? <p>This website provides general information about FEDUWO AGRI CONSULTANT's services. Content is not a substitute for an individual professional assessment. Please contact us to discuss your specific needs.</p> : <p>Information submitted through contact forms is used to respond to your request and manage our client communications. Please do not include sensitive personal data unless it is necessary. For questions about your information or to request access or correction, contact <a href="mailto:feduwofelix@gmail.com">feduwofelix@gmail.com</a>.</p>}<p>We aim to handle personal information responsibly and in accordance with applicable Kenyan data protection requirements. Information is retained only as needed for the purpose for which it was provided or as required by law.</p><p>For questions, contact <a href="mailto:feduwofelix@gmail.com">feduwofelix@gmail.com</a>.</p></div></section></>;
}

export default function App() {
  return <><Header/><main><Routes><Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/><Route path="/services" element={<Services/>}/><Route path="/training" element={<Training/>}/><Route path="/careers" element={<Careers/>}/><Route path="/projects" element={<Projects/>}/><Route path="/resources" element={<Resources/>}/><Route path="/resources/:slug" element={<Resources/>}/><Route path="/contact" element={<Contact/>}/><Route path="/admin" element={<Admin/>}/><Route path="/privacy" element={<Legal/>}/><Route path="/terms" element={<Legal terms/>}/><Route path="*" element={<PageHero eyebrow="NOT FOUND" title="This page isn't here." text="Try the navigation to find what you're looking for."/>}/></Routes></main><Footer/></>;
}
