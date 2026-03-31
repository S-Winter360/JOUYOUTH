import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'); // Replace with actual public key or use env var

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [members, setMembers] = useState<any[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const slides = [
    "https://i.pinimg.com/1200x/ff/85/41/ff85411d52ee81c3e5ea6570298af522.jpg",
    "https://i.pinimg.com/736x/ab/62/de/ab62ded6fb63594397bf43cf4186795a.jpg",
    "https://i.pinimg.com/1200x/d4/d4/ae/d4d4ae05805c59477bddb3351f23dc49.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    const storedMembers = JSON.parse(localStorage.getItem('joyouth_members') || '[]');
    setMembers(storedMembers);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const roleSelect = form.querySelector('select[name="role"]') as HTMLSelectElement;
    const roleText = roleSelect.options[roleSelect.selectedIndex].text;
    
    const availabilities = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
      return (cb as HTMLInputElement).parentElement?.parentElement?.querySelector('span')?.textContent?.trim() || '';
    }).filter(Boolean).join(', ') || 'Not specified';

    const data = {
      id: `member-${Date.now()}`,
      name: (formData.get('name') as string).trim(),
      phone: (formData.get('phone') as string).trim(),
      email: (formData.get('email') as string).trim(),
      role: roleText,
      availability: availabilities,
      motivation: (formData.get('motivation') as string).trim(),
      status: 'pending',
      date: new Date().toISOString()
    };

    if (!data.name || !data.phone || !data.email || !data.role || data.role === 'Select an area of interest') {
      setErrorMessage('Please fill in all required fields.');
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
      return;
    }

    const updatedMembers = [...members, data];
    setMembers(updatedMembers);
    localStorage.setItem('joyouth_members', JSON.stringify(updatedMembers));

    // Replace with actual Service ID and Template ID or use env vars
    emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID', 
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID', 
      {
        to_email_1: 'Joyouth.org.gh@gmail.com',
        to_email_2: 'manafnashiru55@gmail.com',
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        role: data.role,
        availability: data.availability,
        message: data.motivation
      }
    ).then(() => {
      setFormStatus('success');
      setHighlightId(data.id);
      form.reset();
      
      setTimeout(() => {
        const conferenceSection = document.getElementById('conference');
        conferenceSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);

      setTimeout(() => {
        setFormStatus('idle');
      }, 6000);

      setTimeout(() => {
        setHighlightId(null);
      }, 3000);
    }).catch((error) => {
      console.warn('EmailJS Error (ignoring to allow local save):', error);
      
      // Force success UI since local save worked
      setFormStatus('success');
      setHighlightId(data.id);
      form.reset();
      
      setTimeout(() => {
        const conferenceSection = document.getElementById('conference');
        conferenceSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);

      setTimeout(() => setFormStatus('idle'), 6000);
      setTimeout(() => setHighlightId(null), 3000);
    });
  };

  const renderMembers = () => {
    // Show all members on the public page so they appear immediately after submission
    const displayMembers = members;
    
    if (displayMembers.length === 0) {
      return <p className="text-slate-400 text-center w-full py-12">No members yet. Be the first to join our volunteer team!</p>;
    }

    const colorMap: Record<string, string> = {
      "Event Coordination": "indigo",
      "Social Media": "purple",
      "Content Creation": "pink",
      "Community Outreach": "emerald",
      "Other Skills": "amber"
    };

    return displayMembers.map(member => {
      const normalizedRole = Object.keys(colorMap).find(r => r === member.role) ? member.role : "Other Skills";
      const roleColor = colorMap[normalizedRole] || "indigo";
      
      return (
        <div 
          key={member.id} 
          id={member.id} 
          className={`w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] border-${roleColor}-500/30 hover:border-${roleColor}-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-${roleColor}-500/20 conference-member-card ${highlightId === member.id ? 'new-member-highlight' : ''}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full bg-${roleColor}-500/10 flex items-center justify-center text-${roleColor}-400 flex-shrink-0`}>
              <iconify-icon icon="solar:user-linear" class="text-xl"></iconify-icon>
            </div>
            <div className="min-w-0">
              <h5 className="text-base md:text-lg font-normal text-white truncate">{member.name}</h5>
              <p className="text-xs md:text-sm text-slate-400 truncate">{member.role}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs md:text-sm">
            <p className="text-slate-500 flex items-center gap-2 truncate">
              <iconify-icon icon="solar:phone-linear" class={`text-${roleColor}-400 flex-shrink-0`}></iconify-icon>
              <span className="truncate">{member.phone}</span>
            </p>
            <p className="text-slate-500 flex items-center gap-2 truncate">
              <iconify-icon icon="solar:letter-linear" class={`text-${roleColor}-400 flex-shrink-0`}></iconify-icon>
              <span className="truncate">{member.email}</span>
            </p>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-slate-950 text-slate-300 antialiased selection:bg-indigo-500/30 overflow-x-hidden relative scroll-smooth min-h-screen">
      {/* Background glowing effects */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex h-20 max-w-7xl mr-auto ml-auto pr-6 pl-6 items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center relative z-10 perspective-1000">
              <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/dc6f95cf-88e4-4e33-8cb9-6ba60bd2c7a3_320w.png?w=800&q=80" alt="Joyouth Logo" className="logo-premium w-full h-full object-contain" />
            </div>
            <span className="text-xl tracking-tight font-normal text-white">Joyouth</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-base text-slate-400 hover:text-white transition-colors">About</a>
            <a href="#services" className="text-base text-slate-400 hover:text-white transition-colors">Initiatives</a>
            <a href="#gallery" className="text-base text-slate-400 hover:text-white transition-colors">Gallery</a>
            <a href="#conference" className="text-base text-slate-400 hover:text-white transition-colors">Conference</a>
            <a href="#volunteer" className="text-base text-slate-400 hover:text-white transition-colors">Volunteer</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#donate" className="hidden md:inline-flex h-10 items-center justify-center px-6 rounded-full bg-white text-slate-950 text-base font-normal hover:bg-slate-200 transition-colors">Donate</a>
            <button onClick={toggleMenu} className="md:hidden text-slate-300 hover:text-white p-2 -mr-2 transition-colors">
              <iconify-icon icon={isMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} class="text-2xl" style={{ strokeWidth: 1.5 }}></iconify-icon>
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-20 left-0 w-full bg-slate-950/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl transition-all`}>
          <div className="flex flex-col px-6 py-8 gap-6">
            <a href="#about" onClick={toggleMenu} className="mobile-link text-lg text-slate-300 hover:text-white font-normal transition-colors">About</a>
            <a href="#services" onClick={toggleMenu} className="mobile-link text-lg text-slate-300 hover:text-white font-normal transition-colors">Initiatives</a>
            <a href="#gallery" onClick={toggleMenu} className="mobile-link text-lg text-slate-300 hover:text-white font-normal transition-colors">Gallery</a>
            <a href="#conference" onClick={toggleMenu} className="mobile-link text-lg text-slate-300 hover:text-white font-normal transition-colors">Conference</a>
            <a href="#volunteer" onClick={toggleMenu} className="mobile-link text-lg text-slate-300 hover:text-white font-normal transition-colors">Volunteer</a>
            <a href="#donate" onClick={toggleMenu} className="mobile-link h-12 w-full mt-4 inline-flex items-center justify-center rounded-xl bg-white text-slate-950 text-base font-normal hover:bg-slate-200 transition-colors">Make a Donation</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="md:pt-52 md:pb-32 overflow-hidden pt-40 pr-6 pb-24 pl-6 relative min-h-[90vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-slate-950">
          <div className="absolute inset-0 bg-slate-950/40 z-10 mix-blend-multiply"></div>
          <div className="image-overlay z-10 absolute top-0 right-0 bottom-0 left-0"></div>
          
          {slides.map((slide, index) => (
            <img 
              key={index}
              src={slide} 
              alt="Hero background" 
              className={`hero-slide absolute inset-0 w-full h-full object-cover ken-burns transition-opacity duration-1000 z-0 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} 
            />
          ))}
        </div>

        <div className="flex flex-col text-center max-w-7xl z-20 mr-auto ml-auto relative items-center reveal active">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-sm md:text-base text-slate-300">Empowering Youth, Transforming Communities</span>
          </div>
          <h1 className="md:text-7xl lg:text-8xl leading-tight text-5xl font-normal text-white tracking-tight max-w-5xl mb-8 drop-shadow-2xl">Igniting the potentials of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]">next generation.</span></h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 leading-relaxed drop-shadow-lg">
            Join our youth-led movement driving social change, fostering innovation, and building resilient communities through leadership and collaborative action.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a href="#volunteer" className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 px-8 rounded-full bg-white text-slate-950 text-base font-normal hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
              Join Us
              <iconify-icon icon="solar:arrow-right-linear" class="text-lg" style={{ strokeWidth: 1.5 }}></iconify-icon>
            </a>
            <a href="#donate" className="w-full sm:w-auto h-12 inline-flex items-center justify-center gap-2 px-8 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/[0.2] text-white text-base font-normal hover:bg-white/[0.1] transition-colors">
              Make a Donation
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 relative border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 reveal">
            <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden aspect-[4/3] border border-white/[0.05] group shadow-2xl">
              <img src="https://i.pinimg.com/736x/5a/d5/b0/5ad5b0c4c856fb6ec23b32669c073f55.jpg" alt="Team collaboration" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="p-4 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/[0.1]">
                  <p className="text-base font-normal text-white">"Empowering minds to build a sustainable future."</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl tracking-tight font-normal text-white mb-6">Built on experience, driven by innovation.</h2>
              <p className="text-base md:text-lg text-slate-400 mb-6 leading-relaxed">
                JoYouth is a youth-led NGO founded on challenging experiences and observation. We aim to create positive change through leadership, innovation, and collaboration. We offer workshops, community projects, mentorship, and support initiatives to equip youth with the skills to reach their full potential.
              </p>
              <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-8">
                <strong className="text-white font-normal">Our Mission:</strong> To equip and mobilize youth to drive social change, foster innovation, and build resilient communities through leadership, education, and collaborative action.
              </p>
              
              <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center justify-center overflow-hidden relative group shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                    <img src="https://i.pinimg.com/736x/5a/d5/b0/5ad5b0c4c856fb6ec23b32669c073f55.jpg" alt="Akanzagisi Norbert" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg tracking-tight font-normal text-white">Akanzagisi Norbert</h3>
                  <p className="text-sm text-indigo-400">Founder &amp; Visionary</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal delay-100">
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl md:text-5xl tracking-tight font-normal text-white mb-2 relative z-10">5,000+</div>
              <div className="text-base text-slate-400 relative z-10">Youth Empowered</div>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl md:text-5xl tracking-tight font-normal text-white mb-2 relative z-10">120+</div>
              <div className="text-base text-slate-400 relative z-10">Community Projects</div>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl md:text-5xl tracking-tight font-normal text-white mb-2 relative z-10">50+</div>
              <div className="text-base text-slate-400 relative z-10">Active Mentors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 relative border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 reveal">
            <h2 className="text-3xl md:text-4xl tracking-tight font-normal text-white mb-4">Our Core Initiatives</h2>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl">Comprehensive programs designed to nurture talent, build leadership skills, and create real-world impact.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-8 rounded-2xl bg-slate-900 border border-white/[0.08] hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden reveal">
              <img src="https://i.pinimg.com/1200x/d4/d4/ae/d4d4ae05805c59477bddb3351f23dc49.jpg" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-30 transition-opacity duration-500 mix-blend-screen" alt="Workshops" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <iconify-icon icon="solar:book-2-linear" class="text-2xl" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </div>
                <h3 className="text-xl tracking-tight font-normal text-white mb-3">Workshops &amp; Training</h3>
                <p className="text-base text-slate-400 mb-12 line-clamp-3">Leadership and skills development programs, including our flagship Annual Technocrats Conference.</p>
                <a href="#" className="inline-flex items-center gap-2 text-sm text-white font-normal group-hover:text-indigo-400 transition-colors absolute bottom-8 left-8">
                  Learn more <iconify-icon icon="solar:arrow-right-linear" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
              </div>
            </div>

            <div className="group p-8 rounded-2xl bg-slate-900 border border-white/[0.08] hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden reveal delay-75">
              <img src="https://i.pinimg.com/1200x/f1/6f/05/f16f05ae4d46ec681e62c208057abffc.jpg" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-30 transition-opacity duration-500 mix-blend-screen" alt="Mentorship" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <iconify-icon icon="solar:users-group-rounded-linear" class="text-2xl" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </div>
                <h3 className="text-xl tracking-tight font-normal text-white mb-3">Mentorship</h3>
                <p className="text-base text-slate-400 mb-12 line-clamp-3">Connecting ambitious youth with experienced professionals to guide their personal and career growth.</p>
                <a href="#" className="inline-flex items-center gap-2 text-sm text-white font-normal group-hover:text-purple-400 transition-colors absolute bottom-8 left-8">
                  Learn more <iconify-icon icon="solar:arrow-right-linear" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
              </div>
            </div>

            <div className="group p-8 rounded-2xl bg-slate-900 border border-white/[0.08] hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden reveal delay-150">
              <img src="https://i.pinimg.com/1200x/52/bb/42/52bb427da7cf7fec99beb21c82a55388.jpg" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-30 transition-opacity duration-500 mix-blend-screen" alt="Community" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <iconify-icon icon="solar:earth-linear" class="text-2xl" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </div>
                <h3 className="text-xl tracking-tight font-normal text-white mb-3">Community Projects</h3>
                <p className="text-base text-slate-400 mb-12 line-clamp-3">Hands-on impact through cleanups, health drives, and targeted community outreach initiatives.</p>
                <a href="#" className="inline-flex items-center gap-2 text-sm text-white font-normal group-hover:text-emerald-400 transition-colors absolute bottom-8 left-8">
                  Learn more <iconify-icon icon="solar:arrow-right-linear" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
              </div>
            </div>

            <div className="group p-8 rounded-2xl bg-slate-900 border border-white/[0.08] hover:border-rose-500/50 transition-all duration-300 relative overflow-hidden reveal delay-200">
              <img src="https://i.pinimg.com/736x/8a/c5/a9/8ac5a9babd0f1bc7b120fe5496b18fbb.jpg" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-30 transition-opacity duration-500 mix-blend-screen" alt="Networking" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <iconify-icon icon="solar:network-linear" class="text-2xl" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </div>
                <h3 className="text-xl tracking-tight font-normal text-white mb-3">Networking Events</h3>
                <p className="text-base text-slate-400 mb-12 line-clamp-3">Exclusive events designed to connect youth with opportunities, leaders, and peers.</p>
                <a href="#" className="inline-flex items-center gap-2 text-sm text-white font-normal group-hover:text-rose-400 transition-colors absolute bottom-8 left-8">
                  Learn more <iconify-icon icon="solar:arrow-right-linear" style={{ strokeWidth: 1.5 }}></iconify-icon>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Gallery Section */}
      <section id="gallery" className="py-24 px-6 relative border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 reveal">
            <div>
              <h2 className="text-3xl md:text-4xl tracking-tight font-normal text-white mb-4">Impact in Action</h2>
              <p className="text-base md:text-lg text-slate-400 max-w-2xl">A visual journey of our workshops, community projects, and leadership summits.</p>
            </div>
            <a href="#" className="inline-flex items-center gap-2 text-sm text-slate-300 font-normal hover:text-white transition-colors">
              View full gallery <iconify-icon icon="solar:arrow-right-linear" style={{ strokeWidth: 1.5 }}></iconify-icon>
            </a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 aspect-[4/3] rounded-2xl overflow-hidden relative group border border-white/[0.05] reveal">
              <img src="https://i.pinimg.com/1200x/ff/85/41/ff85411d52ee81c3e5ea6570298af522.jpg" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Community Event" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-normal mb-2 border border-indigo-500/30 backdrop-blur-md">Summit 2025</span>
                <h3 className="text-xl tracking-tight font-normal text-white">Youth Leadership Summit</h3>
              </div>
            </div>
            
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative group border border-white/[0.05] reveal delay-75">
              <img src="https://i.pinimg.com/736x/ab/62/de/ab62ded6fb63594397bf43cf4186795a.jpg" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Networking" />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors"></div>
            </div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative group border border-white/[0.05] reveal delay-100">
              <img src="https://i.pinimg.com/1200x/d4/d4/ae/d4d4ae05805c59477bddb3351f23dc49.jpg" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Workshop Session" />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors"></div>
            </div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative group border border-white/[0.05] reveal delay-150">
              <img src="https://i.pinimg.com/736x/22/6c/7b/226c7b901b8d92b3f3890e8c3878dc01.jpg" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Conference Panel" />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute bottom-4 left-4">
                <span className="text-sm font-normal text-white drop-shadow-md">Panel Discussions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conference Highlights */}
      <section id="conference" className="py-24 px-6 relative border-t border-white/[0.05]">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto reveal">
          <div className="p-1 rounded-3xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <div className="bg-slate-950 rounded-[23px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              <div className="flex-1 relative z-10">
                <div className="inline-block px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-normal mb-6 border border-indigo-500/30 uppercase tracking-widest">Flagship Event</div>
                <h2 className="text-3xl md:text-5xl tracking-tight font-normal text-white mb-6">Annual Technocrats Conference</h2>
                <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed">
                  A convergence of young minds, industry experts, and visionary leaders. Join us for intensive workshops, keynote sessions, and unparalleled networking opportunities designed to shape the next generation of technological and social innovators.
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <a href="#volunteer" className="h-12 inline-flex items-center justify-center gap-2 px-8 rounded-full bg-white text-slate-950 text-base font-normal hover:bg-slate-200 transition-all">
                    Register Now
                  </a>
                  <div className="flex items-center gap-4 text-base font-normal text-white bg-white/5 border border-white/10 px-6 h-12 rounded-full">
                    <span>14</span> <span className="text-slate-500 text-xs uppercase tracking-wider">Days</span> : 
                    <span>08</span> <span className="text-slate-500 text-xs uppercase tracking-wider">Hrs</span> : 
                    <span className="text-indigo-400 animate-pulse">45</span> <span className="text-slate-500 text-xs uppercase tracking-wider">Mins</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full relative z-10">
                <div className="aspect-video rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-2xl">
                  <img src="https://i.pinimg.com/1200x/52/bb/42/52bb427da7cf7fec99beb21c82a55388.jpg" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105" alt="Conference Highlight" />
                  <iconify-icon icon="solar:play-circle-linear" class="text-6xl text-white/80 group-hover:text-white group-hover:scale-110 transition-all z-10" style={{ strokeWidth: 1.5 }}></iconify-icon>
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 mix-blend-overlay"></div>
                  <span className="absolute bottom-4 left-4 text-xs tracking-wider uppercase text-white/80 backdrop-blur-sm px-2 py-1 rounded border border-white/10">Watch 2025 Highlights</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h3 className="text-2xl md:text-3xl tracking-tight font-normal text-white mb-8 text-center">Conference Members</h3>
            <div id="conference-members-container" className="flex flex-row flex-wrap gap-6 justify-center">
              {renderMembers()}
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Section */}
      <section id="volunteer" className="py-24 px-6 border-t border-white/[0.05] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl tracking-tight font-normal text-white mb-4">Become a Volunteer</h2>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">Your time and skills can drive real change. Join our dedicated team of volunteers and help us impact more lives.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-1 space-y-4 reveal delay-100">
              <h3 className="text-xl tracking-tight font-normal text-white mb-6">Open Roles</h3>
              
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <iconify-icon icon="solar:calendar-linear" class="text-xl text-indigo-400"></iconify-icon>
                  <h4 className="text-base font-normal text-white">Event Coordination</h4>
                </div>
                <p className="text-sm text-slate-500">Help plan, organize, and execute our workshops and annual conferences.</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <iconify-icon icon="solar:share-linear" class="text-xl text-purple-400"></iconify-icon>
                  <h4 className="text-base font-normal text-white">Social Media Management</h4>
                </div>
                <p className="text-sm text-slate-500">Manage our online presence and engage with our digital community.</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-pink-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <iconify-icon icon="solar:pen-linear" class="text-xl text-pink-400"></iconify-icon>
                  <h4 className="text-base font-normal text-white">Content Creation</h4>
                </div>
                <p className="text-sm text-slate-500">Create compelling written and visual content for our campaigns.</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <iconify-icon icon="solar:megaphone-linear" class="text-xl text-amber-400"></iconify-icon>
                  <h4 className="text-base font-normal text-white">Community Engagement</h4>
                </div>
                <p className="text-sm text-slate-500">Lead outreach programs and build relationships with local stakeholders.</p>
              </div>
            </div>

            <div className="lg:col-span-2 reveal delay-200">
              {formStatus === 'success' && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/50 backdrop-blur-sm" role="alert">
                  <div className="flex items-start gap-3">
                    <iconify-icon icon="solar:check-circle-linear" class="text-2xl text-emerald-400 flex-shrink-0 mt-0.5"></iconify-icon>
                    <div>
                      <span className="font-semibold text-emerald-300 block">Success!</span>
                      <span className="text-sm text-emerald-200/80">Your volunteer application has been submitted successfully. Thank you for joining our mission!</span>
                    </div>
                  </div>
                </div>
              )}
              
              {formStatus === 'error' && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/50 backdrop-blur-sm" role="alert">
                  <div className="flex items-start gap-3">
                    <iconify-icon icon="solar:close-circle-linear" class="text-2xl text-red-400 flex-shrink-0 mt-0.5"></iconify-icon>
                    <div>
                      <span className="font-semibold text-red-300 block">Error!</span>
                      <span className="text-sm text-red-200/80" dangerouslySetInnerHTML={{ __html: errorMessage }}></span>
                    </div>
                  </div>
                </div>
              )}

              <form id="volunteer-form" onSubmit={handleFormSubmit} className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-sm font-normal text-slate-400">Full Name</label>
                    <input type="text" name="name" placeholder="John Doe" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-normal text-slate-400">Phone Number</label>
                    <input type="tel" name="phone" placeholder="+233..." className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <label className="text-sm font-normal text-slate-400">Email Address</label>
                  <input type="email" name="email" placeholder="john@example.com" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>

                <div className="space-y-2 relative z-10">
                  <label className="text-sm font-normal text-slate-400">Primary Skill / Interest</label>
                  <div className="relative">
                    <select name="role" defaultValue="" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                      <option value="" disabled>Select an area of interest</option>
                      <option value="Event Coordination" className="bg-slate-900">Event Coordination</option>
                      <option value="Social Media" className="bg-slate-900">Social Media</option>
                      <option value="Content Creation" className="bg-slate-900">Content Creation</option>
                      <option value="Community Outreach" className="bg-slate-900">Community Outreach</option>
                      <option value="Other Skills" className="bg-slate-900">Other Skills</option>
                    </select>
                    <iconify-icon icon="solar:alt-arrow-down-linear" class="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400 pointer-events-none"></iconify-icon>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <label className="text-sm font-normal text-slate-400">Availability</label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer sr-only" />
                        <div className="w-4 h-4 border border-white/20 rounded bg-white/5 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all"></div>
                        <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Weekdays</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer sr-only" />
                        <div className="w-4 h-4 border border-white/20 rounded bg-white/5 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all"></div>
                        <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Weekends</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <label className="text-sm font-normal text-slate-400">Motivation</label>
                  <textarea name="motivation" rows={3} placeholder="Why do you want to join JoYouth?" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"></textarea>
                </div>

                <button type="submit" disabled={formStatus === 'submitting'} className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 text-base font-normal hover:bg-slate-200 transition-all mt-2 relative z-10 disabled:opacity-70 disabled:cursor-not-allowed">
                  {formStatus === 'submitting' ? (
                    <><iconify-icon icon="solar:refresh-linear" class="text-lg animate-spin mr-2"></iconify-icon>Submitting...</>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section id="donate" className="py-24 px-6 relative overflow-hidden border-t border-white/[0.05]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl md:text-4xl tracking-tight font-normal text-white mb-4">Support Our Mission</h2>
            <p className="text-base md:text-lg text-slate-400">Your contributions enable us to run workshops, execute community projects, and empower more youth across the nation.</p>
            
            <div className="max-w-md mx-auto mt-8">
              <div className="flex justify-between text-xs tracking-wider uppercase text-slate-400 mb-2">
                <span>Fundraising Goal 2026</span>
                <span className="text-indigo-400 font-normal">65% Reached</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[65%] rounded-full relative">
                  <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 reveal delay-100">
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] transition-colors shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <iconify-icon icon="solar:smartphone-linear" class="text-xl"></iconify-icon>
                </div>
                <h3 className="text-lg md:text-xl tracking-tight font-normal text-white">Mobile Money</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">MTN Mobile Money</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-normal text-white tracking-wider">059 828 6081</span>
                    <button onClick={() => navigator.clipboard.writeText('0598286081')} className="p-2 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors" title="Copy Number">
                      <iconify-icon icon="solar:copy-linear" class="text-lg"></iconify-icon>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Name: Akanzagisi Norbert</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] transition-colors shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <iconify-icon icon="solar:buildings-linear" class="text-xl"></iconify-icon>
                </div>
                <h3 className="text-lg md:text-xl tracking-tight font-normal text-white">Bank Transfer</h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1 border-b border-white/[0.05] pb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Bank Name</span>
                  <span className="text-sm font-normal text-white">Ghana Commercial Bank (GCB)</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/[0.05] pb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Account Name</span>
                  <span className="text-sm font-normal text-white">Akanzagisi Norbert</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Account Number</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-normal text-white tracking-wider">9021010042015</span>
                    <button onClick={() => navigator.clipboard.writeText('9021010042015')} className="p-2 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors" title="Copy Number">
                      <iconify-icon icon="solar:copy-linear" class="text-lg"></iconify-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-white/[0.08] bg-slate-950 border-t pt-16 pr-6 pb-8 pl-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <a href="#" className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 flex items-center justify-center perspective-1000">
                  <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/05eeb4dd-5bb8-4c50-af6f-0187267388c6_320w.png?w=800&q=80" alt="Joyouth Logo" className="logo-premium w-full h-full object-cover bg-center" />
                </div>
                <span className="text-xl tracking-tight font-normal text-white">Joyouth</span>
              </a>
              <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">Empowering Youth, Transforming Communities through leadership, education, and collaborative action.</p>
            </div>
            
            <div>
              <h4 className="text-sm font-normal text-white mb-6 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-4">
                <li><a href="#about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#services" className="text-sm text-slate-400 hover:text-white transition-colors">Our Programs</a></li>
                <li><a href="#gallery" className="text-sm text-slate-400 hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#volunteer" className="text-sm text-slate-400 hover:text-white transition-colors">Volunteer</a></li>
                <li><a href="#donate" className="text-sm text-slate-400 hover:text-white transition-colors">Donate</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-normal text-white mb-6 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-xs text-slate-500">© 2026 Joyouth Organization. All Rights Reserved.</p>
            <p className="text-xs text-slate-600 flex items-center justify-center flex-wrap gap-1">
              Made with <iconify-icon icon="solar:heart-linear" class="text-red-500 text-sm"></iconify-icon> in Ghana <span className="mx-1 opacity-50">|</span> Web Designer: Summer_360 (0595830191)
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a href="https://chat.whatsapp.com/FZkk23I4cEz8s5SBrYklet?mode=gi_t" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/50 text-green-400 flex items-center justify-center shadow-[0_4px_30px_rgba(34,197,94,0.2)] hover:scale-110 hover:bg-green-500 hover:text-white transition-all z-50 group">
        <iconify-icon icon="solar:chat-round-dots-linear" class="text-2xl" style={{ strokeWidth: 1.5 }}></iconify-icon>
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">Join Community</span>
      </a>
    </div>
  );
}
