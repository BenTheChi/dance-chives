import SearchFilterBar from "@/components/ui/SearchFilterBar";
import Eventcard from "@/components/cards";
import { AppNavbar } from "@/components/AppNavbar";

export default function SearchPage() {
    return (
        <>
            <main>
                <AppNavbar />
                <div className="flex flex-wrap gap-3">
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking", "popping"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking", "popping"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["locking"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking"]}
                    />
                    <Eventcard
                        title="B-GIRL-CITY-XIII"
                        series="Part of BGirlcity"
                        imageUrl="cardimage.jpeg.png"
                        date="12/1/2025 - 14/1/2025"
                        city="Houston, TX"
                        styles={["breaking"]}
                    />
                </div>
            </main>
        </>
    );
}
