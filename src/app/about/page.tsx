import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background gradient-bg">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/50">
                    <div className="container px-4 md:px-6 text-center">
                        <div className="space-y-4 max-w-3xl mx-auto">
                            <Badge className="mb-4" variant="secondary">About Us</Badge>
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl gradient-text">
                                Revolutionizing Attendance Management
                            </h1>
                            <p className="text-muted-foreground md:text-xl">
                                SmartQR is dedicated to simplifying educational processes through innovative technology. We believe in making attendance tracking effortless, accurate, and insightful.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Zap className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">Efficiency First</h3>
                                <p className="text-muted-foreground">
                                    We eliminate the time-consuming process of roll calls, saving valuable classroom time for teaching and learning.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Shield className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">Secure & Reliable</h3>
                                <p className="text-muted-foreground">
                                    Our platform ensures data integrity and prevents proxy attendance with advanced verification methods.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">User Centric</h3>
                                <p className="text-muted-foreground">
                                    Designed with students, teachers, and administrators in mind, providing intuitive interfaces for everyone.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Story</h2>
                                <p className="text-muted-foreground text-lg">
                                    SmartQR started as a university project to solve a simple problem: the inefficiency of paper-based attendance. What began as a simple QR scanner has evolved into a comprehensive attendance management system powered by AI.
                                </p>
                                <p className="text-muted-foreground text-lg">
                                    Today, we serve institutions looking to modernize their operations and leverage data for better student outcomes.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>Real-time tracking</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>AI-powered analytics</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>Seamless integration</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                <span className="text-muted-foreground font-medium">Team / Office Image Placeholder</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="py-6 w-full border-t text-center text-xs text-muted-foreground">
                &copy; 2024 SmartQR. All rights reserved.
            </footer>
        </div>
    );
}
