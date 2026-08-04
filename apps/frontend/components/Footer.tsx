export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-3">Little Smarties</h3>
          <p className="text-gray-300 text-sm">Nurturing young minds, building bright futures.</p>
        </div>
        <div>
          <h3 className="font-bold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="/about" className="hover:text-white">About Us</a></li>
            <li><a href="/facilities" className="hover:text-white">Facilities</a></li>
            <li><a href="/contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3">Contact</h3>
          <p className="text-sm text-gray-300">📞 +1 (555) 123-4567</p>
          <p className="text-sm text-gray-300">✉️ info@littlesmarties.com</p>
          <p className="text-sm text-gray-300">📍 123 Learning Lane</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
        <p>&copy; 2024 Little Smarties Nursery. All rights reserved.</p>
      </div>
    </footer>
  );
}
