import { pillarIndex } from "@/components/editorial/routes";

export const dynamic = "force-dynamic";

const route = pillarIndex("news");

export const generateMetadata = route.generateMetadata;
export default route.Page;
