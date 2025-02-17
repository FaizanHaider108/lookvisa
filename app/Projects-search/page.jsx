"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { COUNTRIES, INDUSTRIES } from "@/lib/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowBigLeft, ArrowLeft, ArrowRight, Filter } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import Spinner from "@/components/Spinner";

const ProjectsSearch = () => {
    const [loading, setLoading] = useState(false);
    const [listings, setListings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState("");
    const [sortOption, setSortOption] = useState(""); // Sort option selected
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const searchParams = useSearchParams();
    const country = searchParams.get("country");
    const router = useRouter();
    const seenImpressions = useRef(new Set());

    const fetchListings = async (country) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/search/listing?country=${country}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            setListings(data);
            setFiltered(data);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateImpressions = async (listingId) => {
        try {
            await fetch(`/api/listing/${listingId}/impression`, { method: "POST" });
        } catch (error) {
            console.error("Error updating impressions:", error);
        }
    };

    const updateClicks = async (listingId) => {
        try {
            await fetch(`/api/listing/${listingId}/click`, { method: "POST" });
        } catch (error) {
            console.error("Error updating clicks:", error);
        }
    };

    const parseRangeValue = (rangeString) => {
        if (!rangeString) return 0; // Default value for missing ranges

        // Extract the lower bound of the range
        const match = rangeString.match(/([\d,\.]+)\s*(million|billion)?/i);
        if (!match) return 0;

        let [_, value, unit] = match; // Extract value and unit
        value = parseFloat(value.replace(/,/g, "")); // Remove commas and convert to a number

        // Convert units
        if (unit?.toLowerCase() === "million") {
            value *= 1_000_000;
        } else if (unit?.toLowerCase() === "billion") {
            value *= 1_000_000_000;
        }

        return value;
    };

    useEffect(() => {
        if (country) fetchListings(country);
    }, [country]);

    // Apply filters and sorting
    useEffect(() => {
        let filteredListings = selectedIndustry
            ? listings.filter((listing) => listing.investmentIndustry === selectedIndustry)
            : listings;

        // Sorting logic
        if (sortOption === "investmentAmountDesc") {
            filteredListings = filteredListings.sort((a, b) => {
                const amountA = parseRangeValue(a.minimumInvestment);
                const amountB = parseRangeValue(b.minimumInvestment);
                return amountA - amountB;
            });
        } else if (sortOption === "investmentAmountAsc") {
            filteredListings = filteredListings.sort((a, b) => {
                const amountA = parseRangeValue(a.minimumInvestment);
                const amountB = parseRangeValue(b.minimumInvestment);
                return amountB - amountA;
            });
        } else if (sortOption === "datePostedDesc") {
            filteredListings = filteredListings.sort((a, b) => {
                const dateA = new Date(a.publishedAt);
                const dateB = new Date(b.publishedAt);
                return dateA - dateB;
            });
        } else if (sortOption === "datePostedAsc") {
            filteredListings = filteredListings.sort((a, b) => {
                const dateA = new Date(a.publishedAt);
                const dateB = new Date(b.publishedAt);
                return dateB - dateA;
            });
        }

        setFiltered(filteredListings);
        setCurrentPage(1);
    }, [listings, selectedIndustry, sortOption]);

    const handleIndustryChange = (value) => {
        setSelectedIndustry(value);
    };

    const handleSortChange = (value) => {
        setSortOption(value);
    };

    const handleCountryChange = (country) => {
        router.push(`/Projects-search?country=${country}`);
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentListings = filtered.slice(startIndex, startIndex + itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    return (
        <div className="flex justify-center flex-col items-center gap-2 w-full">
            <div className="mt-4 w-[50%] m-auto">
                <div className="border rounded-md p-4 border-blue-400">
                    <Select onValueChange={handleCountryChange}>
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder="Search for other countries with visa sponsor" />
                        </SelectTrigger>
                        <SelectContent>
                            {COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                    {country}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="mx-auto rounded-lg w-[80%] mt-4 h-screen p-2 gap-4 flex items-start">
                <div className="w-full flex justify-between gap-4 flex-wrap">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg w-[20%]">
                        <div className="w-full flex justify-between">
                            <h1 className="font-bold text-blue-400">Apply Filters</h1>
                            <Filter />
                        </div>
                        <div className="mt-4">
                            <Select onValueChange={handleIndustryChange}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select Industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDUSTRIES.map((industry) => (
                                        <SelectItem key={industry} value={industry}>
                                            {industry}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mt-4">
                            <Select onValueChange={handleSortChange}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="investmentAmountAsc">
                                        Investment Amount Ascending
                                    </SelectItem>
                                    <SelectItem value="investmentAmountDesc">
                                        highest to lowest investment amount Low
                                    </SelectItem>
                                    <SelectItem value="datePostedAsc">
                                        Old Listings posted
                                    </SelectItem>
                                    <SelectItem value="datePostedDesc">
                                        Old Listings posted
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg w-[70%] mx-auto">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-400">
                                Projects Listings
                            </h1>
                            <p>Search Results for {country}: {filtered.length}</p>
                        </div>
                        <div className="mt-4 w-full p-4 rounded-lg">
                            {loading ? (
                                <Spinner />
                            ) : currentListings.length === 0 && !loading ? (
                                <p className="text-center">
                                    Sorry no results for your query. Please revise your criteria.
                                </p>
                            ) : (
                                currentListings.map((listing) => (
                                    <ProjectCard
                                        key={listing._id}
                                        listing={listing}
                                        updateImpressions={updateImpressions}
                                        updateClicks={updateClicks}
                                        seenImpressions={seenImpressions}
                                    />
                                ))
                            )}
                        </div>
                        {/* Pagination Controls */}
                        {(currentListings && currentListings.length > 0) && (<div className="flex justify-between items-center mt-4">
                            <button
                                className="btn flex items-center gap-2 bg-blue-400 text-white p-2 rounded-md btn-secondary"
                                disabled={currentPage === 1}
                                onClick={handlePrevPage}
                            >
                                <ArrowLeft size={15} />
                                Previous
                            </button>
                            <p>
                                Page {currentPage} of {totalPages}
                            </p>
                            <button
                                className="btn flex items-center gap-2 bg-blue-400 text-white p-2 rounded-md btn-secondary"
                                disabled={currentPage === totalPages}
                                onClick={handleNextPage}
                            >
                                Next
                                <ArrowRight size={15} />
                            </button>
                        </div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectsSearch;
