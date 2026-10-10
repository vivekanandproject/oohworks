import { pillarArticle } from "@/components/editorial/routes";

export const dynamic = "force-dynamic";

const route = pillarArticle("analysis");

export const generateMetadata = route.generateMetadata;
export default route.Page;
