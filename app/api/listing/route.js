import Listing from "@/models/listing";
import { connectToDB } from "@/utils/database";
import verifyToken from "@/utils/verifyToken";

export const POST = async (req) => {
    try {
        const body = await req.json();
        const user = verifyToken(req);

        if (!user) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
            });
        }
        if (user.role !== "Visa Sponsor") {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
            });
        }

        const {
            countryForInvestment,
            sponsorShipDescription,
            telegram,
            whatsapp,
            contactEmail,
            phone,
            investmentIndustry,
            investmentTimeTable,
            countriesForInvestors,
            minimumInvestment,
            projectDescription,
            images,
        } = body;

        if (
            !countryForInvestment ||
            !sponsorShipDescription ||
            !telegram ||
            !whatsapp ||
            !contactEmail ||
            !phone ||
            !investmentIndustry ||
            !investmentTimeTable ||
            !countriesForInvestors ||
            !minimumInvestment ||
            !projectDescription ||
            !images
        ) {
            return new Response(
                JSON.stringify({ message: "Missing required fields" }),
                { status: 400 }
            );
        }

        await connectToDB();

        const listing = await Listing.create({
            ...body,
            author: user._id,
        });

        return new Response(JSON.stringify(listing), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
            status: 500,
        });
    }
};

export const GET = async (req) => {
    try {
        const user = verifyToken(req);

        if (!user) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
            });
        }
        if (user.role !== "Visa Sponsor") {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
            });
        }

        const id = user._id

        await connectToDB();

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - 30);

        await Listing.updateMany(
            {
                createdAt: { $lte: expiryDate },
                status: { $ne: "Expired" }
            },
            { $set: { status: "Expired" } }
        );

        const listings = await Listing.find({ author: id });

        if (!listings) {
            return new Response(JSON.stringify({ message: "Listings not found" }), {
                status: 400,
            });
        }

        return new Response(JSON.stringify(listings), { status: 200 });
    } catch (error) {
        console.error("Error checking user existence:", error);
        return new Response(JSON.stringify({ message: "Internal server error" }), {
            status: 500,
        });
    }
};
