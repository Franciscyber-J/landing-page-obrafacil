import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Quote, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './TestimonialsFaq.module.css';

export default function TestimonialsFaq() {
    const { t } = useTranslation();
    const [openFaq, setOpenFaq] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const testimonials = [
        {
            text: t('social.test1'),
            author: t('social.author1'),
            role: t('social.role1'),
        },
        {
            text: t('social.test2'),
            author: t('social.author2'),
            role: t('social.role2'),
        },
        {
            text: t('social.test3'),
            author: t('social.author3'),
            role: t('social.role3'),
        },
        {
            text: t('social.test4'),
            author: t('social.author4'),
            role: t('social.role4'),
        },
        {
            text: t('social.test5'),
            author: t('social.author5'),
            role: t('social.role5'),
        },
    ];

    const faqs = [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
        { q: t('faq.q6'), a: t('faq.a6') },
        { q: t('faq.q7'), a: t('faq.a7') },
        { q: t('faq.q8'), a: t('faq.a8') },
        { q: t('faq.q9'), a: t('faq.a9') },
        { q: t('faq.q10'), a: t('faq.a10') },
    ];

    return (
        <section className={`section ${styles.section}`}>
            <div className="container">

                {/* Testimonials */}
                <div className="mb-5">
                    <h2 className="text-center mb-4" style={{ fontSize: '2rem', fontWeight: 800 }}>
                        {t('social.title')}
                    </h2>

                    <div className={styles.carouselWrapper}>
                        <button className={styles.navBtn} onClick={prevTestimonial} aria-label="Anterior">
                            <ChevronLeft size={24} />
                        </button>

                        <div className={styles.carouselContainer}>
                            {testimonials.map((test, index) => {
                                let position = styles.hiddenCard;

                                if (index === currentIndex) {
                                    position = styles.activeCard;
                                } else if (index === (currentIndex - 1 + testimonials.length) % testimonials.length) {
                                    position = styles.prevCard;
                                } else if (index === (currentIndex + 1) % testimonials.length) {
                                    position = styles.nextCard;
                                }

                                return (
                                    <div
                                        key={index}
                                        className={`glass-panel ${styles.testimonialCard} ${position}`}
                                        onClick={() => setCurrentIndex(index)}
                                    >
                                        <Quote size={32} className={styles.quoteIcon} />
                                        <p className={styles.testText}>{test.text}</p>
                                        <div className={styles.authorInfo}>
                                            <div className={styles.avatar}></div>
                                            <div>
                                                <h4 className={styles.authorName}>{test.author}</h4>
                                                <span className={styles.authorRole}>{test.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button className={styles.navBtn} onClick={nextTestimonial} aria-label="Próximo">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className={styles.faqContainer}>
                    <h2 className="text-center mb-4" style={{ fontSize: '2rem', fontWeight: 800 }}>
                        {t('faq.title')}
                    </h2>

                    <div className={styles.accordion}>
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className={`glass-panel ${styles.faqItem} ${openFaq === idx ? styles.active : ''}`}
                                onClick={() => toggleFaq(idx)}
                            >
                                <div className={styles.faqHeader}>
                                    <h3 className={styles.faqQuestion}>{faq.q}</h3>
                                    {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                                {openFaq === idx && (
                                    <div className={styles.faqBody}>
                                        <p>{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
