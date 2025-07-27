// No necesitamos importar React explícitamente en React 18+
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div className="App">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h1 className="text-3xl font-bold mb-2">TechSolutions Pro - Plataforma de Gestión Empresarial</h1>
        <p className="text-blue-100">Soluciones integrales para optimizar tu negocio</p>
      </header>
      
      <main className="p-6 max-w-6xl mx-auto">
        {/* Sección de Servicios */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nuestros Servicios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold text-blue-600 mb-3">Gestión de Inventarios</h3>
              <p className="text-gray-600 mb-3">
                Sistema completo para el control de stock, seguimiento de productos y gestión de almacenes.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Control de stock en tiempo real</li>
                <li>• Alertas de inventario bajo</li>
                <li>• Reportes de movimientos</li>
                <li>• Integración con códigos de barras</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold text-green-600 mb-3">CRM y Ventas</h3>
              <p className="text-gray-600 mb-3">
                Herramientas avanzadas para gestionar clientes, oportunidades de venta y seguimiento comercial.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Base de datos de clientes</li>
                <li>• Pipeline de ventas</li>
                <li>• Automatización de marketing</li>
                <li>• Análisis de rendimiento</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold text-purple-600 mb-3">Recursos Humanos</h3>
              <p className="text-gray-600 mb-3">
                Plataforma integral para la gestión de personal, nóminas y desarrollo profesional.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Gestión de empleados</li>
                <li>• Control de asistencia</li>
                <li>• Evaluaciones de desempeño</li>
                <li>• Capacitación y desarrollo</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sección de Características */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Características Principales</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Tecnología</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Arquitectura en la nube con AWS</li>
                  <li>• API REST para integraciones</li>
                  <li>• Interfaz responsive y moderna</li>
                  <li>• Seguridad de nivel empresarial</li>
                  <li>• Backup automático diario</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Beneficios</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Reducción de costos operativos hasta 30%</li>
                  <li>• Mejora en productividad del equipo</li>
                  <li>• Reportes en tiempo real</li>
                  <li>• Soporte técnico 24/7</li>
                  <li>• Actualizaciones automáticas</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Precios */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Planes y Precios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-2">Plan Básico</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">$99<span className="text-sm text-gray-500">/mes</span></p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Hasta 10 usuarios</li>
                <li>• Gestión básica de inventarios</li>
                <li>• CRM básico</li>
                <li>• Soporte por email</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg shadow-md border-2 border-blue-200">
              <h3 className="text-xl font-semibold mb-2">Plan Profesional</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">$199<span className="text-sm text-gray-500">/mes</span></p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Hasta 50 usuarios</li>
                <li>• Todas las funcionalidades</li>
                <li>• Reportes avanzados</li>
                <li>• Soporte prioritario</li>
                <li>• Integraciones API</li>
              </ul>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Más Popular</span>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold mb-2">Plan Enterprise</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">$399<span className="text-sm text-gray-500">/mes</span></p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Usuarios ilimitados</li>
                <li>• Personalización completa</li>
                <li>• Soporte dedicado</li>
                <li>• Implementación asistida</li>
                <li>• SLA garantizado</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Información de la Empresa */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sobre TechSolutions Pro</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              Fundada en 2018, TechSolutions Pro es una empresa líder en desarrollo de software empresarial 
              con sede en Madrid, España. Contamos con más de 500 clientes satisfechos en toda Europa y 
              Latinoamérica.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-blue-600">500+</h4>
                <p className="text-gray-600">Clientes Activos</p>
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-bold text-green-600">99.9%</h4>
                <p className="text-gray-600">Uptime Garantizado</p>
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-bold text-purple-600">24/7</h4>
                <p className="text-gray-600">Soporte Técnico</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Contacto</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Información de Contacto</h3>
                <p className="text-gray-600 mb-2">📧 Email: info@techsolutionspro.com</p>
                <p className="text-gray-600 mb-2">📞 Teléfono: +34 91 123 4567</p>
                <p className="text-gray-600 mb-2">📍 Dirección: Calle Gran Vía 123, Madrid, España</p>
                <p className="text-gray-600">🕒 Horario: Lunes a Viernes, 9:00 - 18:00 CET</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">¿Necesitas Ayuda?</h3>
                <p className="text-gray-600 mb-4">
                  Nuestro asistente de IA está aquí para ayudarte. Puedes preguntarle sobre:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Características y funcionalidades</li>
                  <li>• Precios y planes disponibles</li>
                  <li>• Proceso de implementación</li>
                  <li>• Soporte técnico</li>
                  <li>• Integraciones disponibles</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Widget de Chat */}
      <ChatWidget apiUrl="http://localhost:3001/api/chat" />
    </div>
  );
}

export default App;
