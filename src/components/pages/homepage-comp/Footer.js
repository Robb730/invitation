import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-olive-dark text-beige pt-10 pb-6 px-6 md:px-16 mt-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 🏡 Brand Section */}
        <div>
          <h2 className="text-2xl font-bold mb-3">KuboHub</h2>
          <p className="text-sm opacity-90 leading-relaxed">
            Your trusted place to find cozy stays, beautiful homes, and unique
            experiences. Stay, explore, and feel at home — anywhere.
          </p>
        </div>

        {/* 🔗 Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/"
                className="hover:text-white transition-colors duration-200"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="hover:text-white transition-colors duration-200"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-white transition-colors duration-200"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="hover:text-white transition-colors duration-200"
              >
                Terms & Privacy
              </Link>
            </li>
          </ul>
        </div>

        {/* 📞 Contact / Socials */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Get in Touch</h3>
          <p className="text-sm opacity-90">📍 Baliwag, Bulacan, Philippines</p>
          <p className="text-sm opacity-90">📧 support@kubohub.com</p>
          <p className="text-sm opacity-90 mb-4">☎️ +63 947 880 3404</p>

          {/* Social Media */}
          
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-beige/30 mt-8 pt-4 text-center text-sm text-beige/70">
        © {new Date().getFullYear()} KuboHub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
