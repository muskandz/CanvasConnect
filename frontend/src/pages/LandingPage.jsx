import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { 
  ArrowRight, 
  Users, 
  Zap, 
  Shield, 
  Star, 
  Play,
  CheckCircle,
  MousePointer,
  Palette,
  MessageCircle,
  Globe,
  Sparkles,
  Heart,
  Coffee
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);

  useEffect(() => {
    // Check if user was redirected after account deletion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('deleted') === 'true') {
      setShowDeletedMessage(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Hide message after 10 seconds
      setTimeout(() => setShowDeletedMessage(false), 10000);
    }
  }, []);

  useEffect(() => {
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections
    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work together seamlessly with your team in real-time. See changes instantly and collaborate without conflicts.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Palette,
      title: "Rich Drawing Tools",
      description: "Express your ideas with powerful drawing tools, shapes, text, and infinite canvas possibilities.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: MessageCircle,
      title: "Voice Communication",
      description: "Communicate with your team using built-in voice chat while working on your projects together.",
      color: "from-green-500 to-blue-600"
    },
    {
      icon: Zap,
      title: "Smart Templates",
      description: "Get started quickly with pre-built templates for flowcharts, wireframes, mind maps, and more.",
      color: "from-yellow-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and secure. Control who can access and edit your collaborative boards.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Globe,
      title: "Access Anywhere",
      description: "Work from anywhere with cloud sync. Your projects are always available across all your devices.",
      color: "from-teal-500 to-cyan-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Designer",
      company: "TechCorp",
      avatar: "SC",
      text: "CanvasConnect has revolutionized how our design team collaborates. The real-time features are incredible!"
    },
    {
      name: "Mike Johnson",
      role: "Engineering Manager",
      company: "StartupXYZ",
      avatar: "MJ",
      text: "Perfect for sprint planning and system design sessions. The voice chat integration is a game-changer."
    },
    {
      name: "Emily Rodriguez",
      role: "Creative Director",
      company: "Agency Plus",
      avatar: "ER",
      text: "The drawing tools are intuitive and powerful. Our brainstorming sessions have never been more productive."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 overflow-hidden">
      {/* Account Deleted Success Message */}
      {showDeletedMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Account successfully deleted</span>
            <button 
              onClick={() => setShowDeletedMessage(false)}
              className="ml-4 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-green-600 mt-1">All your data has been permanently removed.</p>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Sticky Notes */}
        <div 
          className="absolute transition-transform duration-1000 ease-out"
          style={{
            left: `${20 + mousePosition.x * 0.02}px`,
            top: `${100 + mousePosition.y * 0.01}px`,
            transform: `rotate(${-5 + mousePosition.x * 0.01}deg)`
          }}
        >
          <div className="w-16 h-16 bg-yellow-300 shadow-lg transform rotate-12 opacity-80">
            <div className="w-full h-2 bg-yellow-400"></div>
            <div className="p-2 text-xs text-gray-700">Ideas!</div>
          </div>
        </div>

        <div 
          className="absolute transition-transform duration-1000 ease-out"
          style={{
            right: `${50 + mousePosition.x * 0.01}px`,
            top: `${200 + mousePosition.y * 0.02}px`,
            transform: `rotate(${10 - mousePosition.x * 0.01}deg)`
          }}
        >
          <div className="w-20 h-20 bg-pink-300 shadow-lg transform -rotate-6 opacity-70">
            <div className="w-full h-2 bg-pink-400"></div>
            <div className="p-2 text-xs text-gray-700">Collaborate</div>
          </div>
        </div>

        {/* Floating Pen Strokes */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:0.8}} />
              <stop offset="100%" style={{stopColor:"#06B6D4", stopOpacity:0.4}} />
            </linearGradient>
          </defs>
          <path
            d="M 100 300 Q 200 250 300 300 T 500 280"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            className="animate-pulse"
          />
          <path
            d="M 800 150 Q 900 100 1000 150 T 1200 130"
            stroke="url(#strokeGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className="animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </svg>

        {/* Floating Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <Star className="w-4 h-4 text-purple-300 fill-current opacity-60" />
          </div>
        ))}

        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-blue-200 rounded-full animate-spin opacity-30" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg transform rotate-45 animate-bounce opacity-40"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">CC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                CanvasConnect
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Collaborative Workspace</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              ✨ The Future of Collaborative Design
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Create, Collaborate,
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
                Connect
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your ideas into reality with our powerful collaborative whiteboard platform. 
              Design flowcharts, create wireframes, brainstorm with your team - all in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-purple-500 hover:text-purple-600 transition-all flex items-center justify-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Hero Illustration */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="bg-gray-50 rounded-xl p-6 relative overflow-hidden">
                {/* Mock Whiteboard Interface */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-sm text-gray-500">Collaborative Board</div>
                </div>
                
                <svg className="w-full h-64" viewBox="0 0 600 200">
                  {/* Flowchart Elements */}
                  <rect x="50" y="80" width="80" height="40" rx="20" fill="#10b981" className="animate-pulse" />
                  <text x="90" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Start</text>
                  
                  <rect x="180" y="70" width="100" height="60" rx="8" fill="#3b82f6" className="animate-pulse" style={{animationDelay: '0.5s'}} />
                  <text x="230" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Process</text>
                  
                  <polygon points="350,60 400,100 350,140 300,100" fill="#f59e0b" className="animate-pulse" style={{animationDelay: '1s'}} />
                  <text x="350" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Decision</text>
                  
                  <rect x="450" y="80" width="80" height="40" rx="20" fill="#ef4444" className="animate-pulse" style={{animationDelay: '1.5s'}} />
                  <text x="490" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">End</text>
                  
                  {/* Arrows */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                  </defs>
                  <path d="M 130 100 L 180 100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <path d="M 280 100 L 300 100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  <path d="M 400 100 L 450 100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                  
                  {/* Sticky Notes */}
                  <rect x="100" y="20" width="60" height="40" fill="#fef08a" stroke="#fbbf24" strokeWidth="1" className="animate-bounce" />
                  <text x="130" y="35" textAnchor="middle" fontSize="8" fill="#92400e">Great idea!</text>
                  
                  <rect x="400" y="160" width="80" height="30" fill="#fecaca" stroke="#f87171" strokeWidth="1" className="animate-bounce" style={{animationDelay: '0.5s'}} />
                  <text x="440" y="175" textAnchor="middle" fontSize="8" fill="#991b1b">Need review</text>
                  
                  {/* User Cursors */}
                  <g className="animate-pulse">
                    <MousePointer className="w-4 h-4" x="200" y="30" fill="#8b5cf6" />
                    <text x="210" y="28" fontSize="10" fill="#8b5cf6" fontWeight="bold">Sarah</text>
                  </g>
                  <g className="animate-pulse" style={{animationDelay: '1s'}}>
                    <MousePointer className="w-4 h-4" x="320" y="160" fill="#06b6d4" />
                    <text x="330" y="158" fontSize="10" fill="#06b6d4" fontWeight="bold">Mike</text>
                  </g>
                </svg>
                
                {/* Active Users */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">S</div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">M</div>
                      <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">A</div>
                    </div>
                    <span className="text-sm text-gray-600">3 people editing</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Live session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20 bg-white" data-animate>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to collaborate
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make team collaboration seamless and productive
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-2 ${
                  isVisible.features ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 py-20 bg-gradient-to-br from-purple-50 to-blue-50" data-animate>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say about CanvasConnect
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 ${
                  isVisible.testimonials ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-purple-600">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex text-yellow-400 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your collaboration?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using CanvasConnect to bring their ideas to life
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Start Free Today</span>
              <Sparkles className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all flex items-center justify-center space-x-2">
              <span>Contact Sales</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center space-x-8 text-purple-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Setup in minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">CC</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">CanvasConnect</h3>
                  <p className="text-sm text-gray-400">Collaborative Workspace</p>
                </div>
              </div>
              <p className="text-gray-400">
                Empowering teams to create, collaborate, and connect through visual collaboration.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2025 CanvasConnect. Made with <Heart className="w-4 h-4 inline text-red-500 fill-current" /> and <Coffee className="w-4 h-4 inline text-yellow-600 fill-current" />
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
