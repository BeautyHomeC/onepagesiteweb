import ContactForm from './ContactForm'

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto"
    >
      <div className="max-w-2xl">
        <span className="font-label-caps text-primary tracking-widest text-[10px] uppercase block mb-4">
          Contact
        </span>
        <h2 className="font-playfair text-4xl md:text-5xl text-on-surface mb-4 leading-tight">
          Une question ?
        </h2>
        <p className="text-on-surface-variant text-base leading-relaxed mb-12">
          Formation, financement, ou simplement une question avant de vous inscrire — je vous réponds personnellement.
        </p>
        <ContactForm />
      </div>
    </section>
  )
}
