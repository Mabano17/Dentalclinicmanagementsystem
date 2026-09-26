"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiCalendar,
  FiCheckCircle,
  FiStar,
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiArrowRight,
  FiMenu,
  FiX,
  FiShield,
  FiHeart,
  FiSmile,
} from "react-icons/fi";
import { MdOutlineMedicalServices } from "react-icons/md";
import { isAuthenticated, getUser } from "@/lib/auth";

const SERVICES = [
  {
    icon: "🦷",
    title: "Dental Check-up",
    desc: "Comprehensive oral examination and X-rays to keep your smile healthy.",
  },
  {
    icon: "✨",
    title: "Teeth Whitening",
    desc: "Professional whitening treatments for a brighter, more confident smile.",
  },
  {
    icon: "🔧",
    title: "Dental Filling",
    desc: "Restore damaged or decayed teeth with natural-looking composite fillings.",
  },
  {
    icon: "🌿",
    title: "Dental Cleaning",
    desc: "Remove plaque and tartar buildup for fresher breath and healthier gums.",
  },
  {
    icon: "💎",
    title: "Braces Consultation",
    desc: "Straighten your teeth with modern orthodontic solutions tailored for you.",
  },
  {
    icon: "🩺",
    title: "Root Canal Treatment",
    desc: "Pain-free root canal therapy to save infected teeth and relieve discomfort.",
  },
];

const FEATURES = [
  {
    icon: FiShield,
    title: "Safe & Sterile",
    desc: "All equipment is sterilized to the highest standards for your safety.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: FiHeart,
    title: "Patient-First Care",
    desc: "We prioritize your comfort and well-being at every visit.",
    color: "text-rose-500 bg-rose-50",
  },
  {
    icon: FiSmile,
    title: "Expert Dentists",
    desc: "Our licensed dentists bring years of experience and specialized skills.",
    color: "text-teal-600 bg-teal-50",
  },
  {
    icon: FiCalendar,
    title: "Easy Scheduling",
    desc: "Book appointments online in minutes — anytime, anywhere.",
    color: "text-purple-600 bg-purple-50",
  },
];

const TESTIMONIALS = [
  {
    name: "Maria Santos",
    role: "Patient since 2022",
    text: "DentalCare completely changed how I feel about going to the dentist. The staff is incredibly kind and the facility is spotless.",
    stars: 5,
  },
  {
    name: "Jose Reyes",
    role: "Patient since 2023",
    text: "Booking online is so easy and the reminders are helpful. My teeth have never felt better. Highly recommend!",
    stars: 5,
  },
  {
    name: "Ana Cruz",
    role: "Patient since 2021",
    text: "Professional, gentle, and thorough. I've been coming here for years and I always leave satisfied.",
    stars: 5,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      router.replace(user?.role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <MdOutlineMedicalServices className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900">DentalCare</p>
              <p className="text-xs text-gray-400">Clinic Management</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#services" className="hover:text-blue-600 transition-colors">Services</a>
            <a href="#why-us" className="hover:text-blue-600 transition-colors">Why Us</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary btn-sm"
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            {["Services", "Why Us", "Testimonials", "Contact"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(" ", "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link href="/login" className="btn-secondary text-center">Sign In</Link>
              <Link href="/register" className="btn-primary text-center">Book Appointment</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 lg:pt-36 lg:pb-32 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-5">
              <FiCheckCircle className="w-3.5 h-3.5" />
              Trusted Dental Care in the Philippines
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              Your Healthy Smile{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                Starts Here
              </span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Professional dental services with a personal touch. Book appointments
              online, track your treatments, and manage payments — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="btn-primary btn-lg flex items-center justify-center gap-2">
                Book an Appointment <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary btn-lg text-center">
                Sign In to My Account
              </Link>
            </div>
            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-8">
              {[
                { value: "500+", label: "Happy Patients" },
                { value: "10+", label: "Expert Dentists" },
                { value: "15+", label: "Years Experience" },
              ].map((b) => (
                <div key={b.label}>
                  <p className="text-2xl font-bold text-blue-600">{b.value}</p>
                  <p className="text-xs text-gray-400">{b.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration card */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <MdOutlineMedicalServices className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-center text-xl font-bold text-gray-900 mb-2">
                  DentalCare Clinic
                </h3>
                <p className="text-center text-sm text-gray-500 mb-6">
                  Modern dental care at your fingertips
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: FiCheckCircle, text: "Online appointment booking", color: "text-green-500" },
                    { icon: FiCheckCircle, text: "Digital treatment records", color: "text-green-500" },
                    { icon: FiCheckCircle, text: "Secure payment tracking", color: "text-green-500" },
                    { icon: FiCheckCircle, text: "Direct clinic messaging", color: "text-green-500" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-3">
                      <f.icon className={`w-4 h-4 ${f.color} flex-shrink-0`} />
                      <span className="text-sm text-gray-700">{f.text}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/register"
                  className="btn-primary w-full text-center mt-6 block"
                >
                  Get Started — It&apos;s Free
                </Link>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 rounded-2xl px-3 py-2 text-xs font-bold shadow-lg">
                ★ 5.0 Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────────── */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">
              What We Offer
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Our Dental Services
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We offer a full range of dental treatments to keep your entire family
              smiling healthy at every stage of life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-100 transition-all duration-200"
              >
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/register" className="btn-outline inline-flex items-center gap-2">
              View All Services <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────────────────── */}
      <section id="why-us" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Care You Can Trust
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We go beyond just fixing teeth — we build lasting relationships with
              every patient who walks through our doors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">
              Patient Stories
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              What Our Patients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {[...Array(t.stars)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-500">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready for a Healthier Smile?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join hundreds of patients who trust DentalCare for all their dental needs.
            Book your first appointment today — no waiting, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold rounded-xl px-6 py-3 hover:bg-blue-50 transition-colors shadow"
            >
              Create Free Account <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/60 text-white font-semibold rounded-xl px-6 py-3 hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">
              Get In Touch
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Contact Us
            </h2>
            <p className="text-gray-500">
              Have a question? We&apos;re here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FiMapPin,
                label: "Address",
                value: "123 Dental Street, Makati City, Metro Manila",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: FiPhone,
                label: "Phone",
                value: "+63 (02) 8123-4567",
                color: "text-teal-600 bg-teal-50",
              },
              {
                icon: FiMail,
                label: "Email",
                value: "hello@dentalcare.ph",
                color: "text-purple-600 bg-purple-50",
              },
              {
                icon: FiClock,
                label: "Hours",
                value: "Mon–Sat: 8AM–6PM\nSun: Closed",
                color: "text-orange-500 bg-orange-50",
              },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className={`w-12 h-12 rounded-2xl ${c.color} flex items-center justify-center mx-auto mb-4`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {c.label}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <MdOutlineMedicalServices className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">DentalCare</span>
          </div>
          <p className="text-xs text-center">
            © {new Date().getFullYear()} DentalCare Clinic Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
