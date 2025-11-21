import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
// Make sure this path points to where you put the mock-data.ts file
import { categories, getTopTagsForCategory, mockProducts, Product } from "../lib/mock-data";
import { Progress } from "../components/ui/progress";
import { cn } from "../lib/utils";

export default function Quiz() {
    const navigate = useNavigate();
    const [inDepth, setInDepth] = useState(false);
    const maxQuestions = inDepth ? 15 : 5;
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
    const [applicableProducts, setApplicableProducts] = useState<Product[]>(mockProducts);
    const [isComplete, setIsComplete] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const questions = [
        "What category are you looking for?",
        "What type of product interests you?",
        "Any specific features you want?",
        "Price range preference?",
        "Skin type or hair type?",
        "Specific concern?",
        "Fragrance preference?",
        "Brand preference?",
    ];

    // Inactivity timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (Date.now() - lastActivity > 60000) {
                navigate("/");
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [lastActivity, navigate]);

    const handleInteraction = () => {
        setLastActivity(Date.now());
    };

    useEffect(() => {
        if (currentQuestion === 0) {
            setCurrentOptions(categories);
        }
    }, [currentQuestion]);

    // Update options based on previous answers
    useEffect(() => {
        if (selectedAnswers.length > 0 && currentQuestion > 0) {
            if (currentQuestion === 1) {
                const category = selectedAnswers[0];
                const topTags = getTopTagsForCategory(category, 5);
                setCurrentOptions(topTags);
            } else if (currentQuestion > 1) {
                const category = selectedAnswers[0];
                const filtered = mockProducts.filter((p) => {
                    if (p.category !== category) return false;
                    for (let i = 1; i < selectedAnswers.length; i++) {
                        if (!p.tags.includes(selectedAnswers[i])) return false;
                    }
                    return true;
                });
                setApplicableProducts(filtered);

                if (filtered.length <= 15 || currentQuestion >= maxQuestions) {
                    setIsComplete(true);
                    return;
                }

                const tagCount: Record<string, number> = {};
                filtered.forEach((p) => {
                    p.tags.forEach((tag) => {
                        if (!selectedAnswers.includes(tag)) {
                            tagCount[tag] = (tagCount[tag] || 0) + 1;
                        }
                    });
                });

                const nextTags = Object.entries(tagCount)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([tag]) => tag);

                if (nextTags.length > 0) {
                    setCurrentOptions(nextTags);
                } else {
                    setIsComplete(true);
                }
            }
        }
    }, [selectedAnswers, currentQuestion, maxQuestions]);

    // --- FIX: Handle Navigation in useEffect ---
    useEffect(() => {
        if (isComplete) {
            const category = selectedAnswers[0];
            const filtered = mockProducts.filter((p) => {
                if (p.category !== category) return false;
                for (let i = 1; i < selectedAnswers.length; i++) {
                    if (!p.tags.includes(selectedAnswers[i])) return false;
                }
                return true;
            });
            // Perform the navigation here
            navigate("/search-results", { state: { results: filtered } });
        }
    }, [isComplete, navigate, selectedAnswers]);

    const handleSelectAnswer = (answer: string) => {
        handleInteraction();
        const newAnswers = [...selectedAnswers.slice(0, currentQuestion), answer];
        setSelectedAnswers(newAnswers);

        if (currentQuestion >= maxQuestions - 1 || applicableProducts.length <= 15) {
            setIsComplete(true);
        } else {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    // --- FIX: Return null if complete (to render nothing while redirecting) ---
    if (isComplete) {
        return null;
    }

    const progressValue = ((currentQuestion + 1) / maxQuestions) * 100;

    return (
        <div className="dark min-h-screen bg-background text-foreground flex flex-col">
            {/* Video Host Area */}
            <div className="relative w-full h-[35vh] bg-black overflow-hidden shrink-0">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-0">
                    [Video: Maya, smiling host]
                </div>
                <video
                    src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-10 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-20"></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col px-6 pb-8 -mt-8 z-30 relative">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                        {questions[Math.min(currentQuestion, questions.length - 1)]}
                    </h2>
                </div>

                <div className="w-full max-w-2xl mx-auto grid grid-cols-1 gap-3 mb-auto">
                    {currentOptions.map((option, idx) => (
                        <button
                            key={option}
                            onClick={() => handleSelectAnswer(option)}
                            className="group relative flex items-center w-full p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-white/10 hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                        >
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-lg mr-4 group-hover:bg-primary/20 transition-colors">
                                {["🌞", "💧", "⏰", "✨", "🌿"][idx % 5]}
                            </span>
                            <span className="text-lg font-semibold text-white text-left flex-1">
                                {option}
                            </span>
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 group-hover:border-primary group-hover:bg-primary transition-colors" />
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-2xl mx-auto mt-8 space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{currentQuestion + 1}/{maxQuestions}</span>
                    </div>
                    <Progress value={progressValue} className="h-2 bg-secondary" />

                    <div className="flex justify-between items-center mt-6">
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 hover:bg-secondary/50 text-sm font-medium transition-colors text-white"
                        >
                            <div className="bg-black/40 p-1 rounded-full">
                                <ArrowLeft size={14} />
                            </div>
                            Back to Hub
                        </Link>

                        <button
                            onClick={() => setInDepth(!inDepth)}
                            className={cn(
                                "text-xs px-3 py-1 rounded-full border transition-colors",
                                inDepth
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-transparent border-white/10 text-muted-foreground hover:text-white"
                            )}
                        >
                            {inDepth ? "In-depth Mode On" : "Quick Mode"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}