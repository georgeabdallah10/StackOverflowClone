import { useState, useEffect, useCallback } from "react";
import { Menu, X, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./miniUI/button";
import { getUserLocal } from "./backendUserLocal";
import { useSearch } from "@/context/SearchContext";
import level from "@/api/levelSys";
import { useUser } from "@/context/UserContext";
import { useBadges } from "@/context/badgesContext";
import { apikey } from "@/api/apikey";
import { getanswers, getquestions } from "@/views/dashboard/backendDashboard";

const hashEmail = async (email: string): Promise<string> => {
  const cleanedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanedEmail);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const { user, updateUser } = useUser();
  const [hashedemail, setHashedMail] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD or empty
  const { badges, setBadges } = useBadges();

  // On mount, load user info from local storage
  useEffect(() => {
    const localUser = getUserLocal();
    if (localUser) {
      setIsLoggedIn(true);
    }
  }, []);

  // Update scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hash email when user.email changes
  useEffect(() => {
    if (!user?.email) return;
    const fetchHash = async () => {
      const result = await hashEmail(user.email);
      setHashedMail(result);
    };
    fetchHash();
  }, [user?.email]);

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // You could trigger search submit here if needed
      // Currently, searchQuery updates instantly on input change
      // Or add behavior if you want to explicitly submit
    }
  };

  useEffect(() => {
    const changeLevel = async () => {
      if (!user?.points) return;
      const newLevel = level(user.points);
      updateUser({
        level: newLevel,
        pfp: `https://gravatar.com/avatar/${hashedemail}?d=identicon`,
      });
    };
    changeLevel();
  }, [user?.points, hashedemail]);

  // When date filter changes, update searchQuery to "date:YYYY-MM-DD"
  useEffect(() => {
    if (dateFilter) {
      setSearchQuery(`date:${dateFilter}`);
    } else if (searchQuery.startsWith("date:")) {
      // Clear date filter from search query if dateFilter cleared
      setSearchQuery("");
    }
  }, [dateFilter]);

  const toggleSubBadgeCompletion = useCallback(
    (categoryName: string, subBadgeTitle: string, isCompleted: boolean) => {
      setBadges((currentBadges) => {
        const newBadges = { ...currentBadges };
        const categoryToUpdate = newBadges[categoryName];
        if (!categoryToUpdate) return currentBadges;

        const newCategory = { ...categoryToUpdate };
        const subBadgeToUpdate = newCategory.subbadges[subBadgeTitle];
        if (!subBadgeToUpdate || subBadgeToUpdate.completed === isCompleted) {
          return currentBadges;
        }

        newCategory.subbadges = {
          ...newCategory.subbadges,
          [subBadgeTitle]: {
            ...subBadgeToUpdate,
            completed: isCompleted,
          },
        };

        newBadges[categoryName] = newCategory;
        return newBadges;
      });
    },
    [setBadges]
  );

  useEffect(() => {
    if (!user?.points) return;
    updateUser({ points: 3000 });
    // Check if the user has enough points to get the Socratic badge
    if (user.points >= 10000) {
      toggleSubBadgeCompletion("Gold", "Socratic", true);
    } else {
      toggleSubBadgeCompletion("Gold", "Socratic", false);
    }

    // Check for other point-based badges
    if (user.points >= 3000) {
      toggleSubBadgeCompletion("Silver", "Inquisitive", true);
    } else {
      toggleSubBadgeCompletion("Silver", "Inquisitive", false);
    }

    if (user.points >= 100) {
      toggleSubBadgeCompletion("Bronze", "Curious", true);
    } else {
      toggleSubBadgeCompletion("Bronze", "Curious", false);
    }

    if (!user?.username) return;
    const fetchQuestions = async () => {
      const result = await getquestions(user.username, apikey);
      const answersResult = await getanswers(user.username, apikey);
      result.questions.map((question: any) => {
        const netTotal = question.upvotes - question.downvotes;
        if (question.hasAcceptedAnswer) {
          toggleSubBadgeCompletion("Bronze", "Scholar", true);
        }
        if (netTotal >= 100) {
          toggleSubBadgeCompletion("Gold", "Great Question", true);
        } else if (netTotal >= 25) {
          toggleSubBadgeCompletion("Silver", "Good Question", true);
        } else if (netTotal >= 10) {
          toggleSubBadgeCompletion("Bronze", "Nice Question", true);
        }
      });
      answersResult.answers.map((answer: any) => {
        if (answer.accepted) {
          const netTotal = answer.upvotes - answer.downvotes;
          if (netTotal >= 100) {
            toggleSubBadgeCompletion("Gold", "Great Answer", true);
          } else if (netTotal >= 25) {
            toggleSubBadgeCompletion("Silver", "Good Answer", true);
          } else if (netTotal >= 10) {
            toggleSubBadgeCompletion("Bronze", "Nice Answer", true);
          }
        }
      });
    };
    fetchQuestions();
  }, [user?.points, toggleSubBadgeCompletion]);

  return (
    <nav
      className={`
         top-0 left-0 right-0 z-50 transition-all duration-300 flex flex-row 
        ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-border shadow-sm"
            : "bg-transparent"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-center gap-2 h-16 lg:h-20 w-full">
          {/* Logo */}
          <div
            className={`transition-all duration-300 flex items-center space-x-2 ${
              searchOpen ? "-translate-x-2" : ""
            }`}
          >
            <div className="w-max h-max bg-gradient-to-br rounded-lg flex items-center justify-center -translate-y-2.5">
              <img
                className="w-12 h-12 mt-6 bg-white rounded-sm"
                src="https://bdpa.org/wp-content/uploads/2020/12/f0e60ae421144f918f032f455a2ac57a.png"
                alt="Logo"
              />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-foreground">
              Stack overflow
            </span>
          </div>

          {/* Search & Date Filter */}
          <div className="w-max h-max flex items-center space-x-2">
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Toggle Search Input"
              className="hover:bg-gray-100 w-max pr-2 pl-2 h-10 flex justify-center items-center rounded-lg transition-all duration-200 ease-linear cursor-pointer"
            >
              <Search className="w-6 h-6" />
            </button>
            <div className="w-max h-max p-2">
              <input
                type="text"
                placeholder="Search..."
                className={`transition-all duration-300
                  ${searchOpen ? "w-48 px-4 opacity-100" : "w-0 px-0 opacity-0"}
                  py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg
                `}
                style={{ minWidth: searchOpen ? "12rem" : "0" }}
                value={searchQuery.startsWith("date:") ? "" : searchQuery}
                onChange={(e) => {
                  if (!e.target.value.startsWith("date:")) {
                    setSearchQuery(e.target.value);
                    setDateFilter(""); // reset date filter if text search
                  }
                }}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Calendar date picker */}
            {/*<input
              type="date"
              className="border border-gray-300 rounded-lg p-2 cursor-pointer"
              max={new Date().toISOString().split("T")[0]}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter questions from date"
            />*/}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            <a
              href="/"
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-md text-[16.5px] font-medium transition-all duration-300",
                window.location.pathname === "/"
                  ? "text-[#7C3CED] hover:bg-[#F2EBFD] bg-[#E8D7FF]"
                  : "hover:bg-gray-100 opacity-65 hover:opacity-100 hover:font-bold"
              )}
            >
              <span>Home</span>
            </a>
            {isLoggedIn && (
              <>
                <a
                  href="/mail"
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-md text-[16.5px] font-medium transition-all duration-300",
                    window.location.pathname === "/mail"
                      ? "text-[#7C3CED] hover:bg-[#F2EBFD] bg-[#E8D7FF]"
                      : "hover:bg-gray-100 opacity-65 hover:opacity-100 hover:font-bold"
                  )}
                >
                  <span>Mail</span>
                </a>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center justify-around space-x-4 w-max h-max p-2">
            {isLoggedIn ? (
              <>
                {/* Level */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-300 shadow hover:shadow-md transition-all duration-200 hover:bg-gray-100 translate-x-3">
                  <span className="font-medium text-gray-700">Level:</span>
                  <span className="font-semibold text-gray-900">
                    {user?.level}
                  </span>
                </div>

                {/* User Menu */}
                <div className="relative inline-block text-left group w-max">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-300 shadow hover:shadow-md transition-all duration-200 hover:bg-gray-100 focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <img
                      className="w-7 h-7 rounded-full"
                      src={`https://gravatar.com/avatar/${hashedemail}?d=identicon`}
                      alt={`${user?.username}'s avatar`}
                    />
                    <span className="font-medium text-gray-700 w-max">
                      {user?.username}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <button
                      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        window.location.href = "/dashboard";
                      }}
                      type="button"
                    >
                      Dashboard
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-100"
                      onClick={logout}
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                </div>
                {/* Points */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-300 shadow hover:shadow-md transition-all duration-200 hover:bg-gray-100 -translate-x-3">
                  <span className="font-medium text-gray-700">Points:</span>
                  <span className="font-semibold text-gray-900">
                    {user?.points}
                  </span>
                </div>
                {Object.values(badges).map((category) => {
                  // Calculate the number of completed sub-badges
                  const completedCount = Object.values(
                    category.subbadges
                  ).filter((sub) => sub.completed).length;
                  // Get the total number of sub-badges
                  const totalCount = Object.keys(category.subbadges).length;

                  return (
                    // Important: Add a unique 'key' prop when mapping over lists
                    <>
                      <div className="relative inline-block text-left group">
                        <button
                          className="flex items-center gap-2  w-max h-max p-2 rounded-full bg-white border border-gray-300 shadow hover:shadow-md transition-all duration-200 hover:bg-gray-100 focus:outline-none"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <h1
                            className={`font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)] ${
                              category.style === "gold"
                                ? "text-[#E6C200]"
                                : category.style === "silver"
                                ? "text-gray-400"
                                : "text-[#CD7F32]"
                            }`}
                          >
                            {category.name} Badges{" "}
                            <span className="font-medium text-base text-gray-500">
                              {completedCount}/{totalCount}
                            </span>
                          </h1>
                        </button>
                        <div className="absolute right-0 mt-2 flex flex-col gap-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          {Object.values(category.subbadges).map((sub) => (
                            <div
                              className={`block w-full px-4 py-2 text-left text-gray-700  ${
                                sub.completed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                              key={sub.title}
                            >
                              {sub.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })}
              </>
            ) : (
              <div className="relative md:flex items-center space-x-3">
                <Button
                  className="bg-[#7C3CED] w-max h-max p-3 pr-4 pl-4 font-bold text-white hover:bg-[#894EEF] transition-all duration-300 ease-linear cursor-pointer"
                  onClick={() => (window.location.href = "/register")}
                >
                  Register
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden transition-all duration-[50ms] ease-in-out overflow-hidden",
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {isLoggedIn ? (
            <div className="py-4 space-y-2">
              <div className="pt-4 mt-4 border-t border-border space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/")}
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => (window.location.href = "/mail")}
                >
                  Mail
                </Button>
              </div>
            </div>
          ) : (
            <h1>Register to access more features!</h1>
          )}
        </div>
      </div>
    </nav>
  );
}
