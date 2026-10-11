// Entry route. The tab group is the real home; this only forwards there.
import { Redirect } from "expo-router";

export default function Index() {
    return <Redirect href={"/(tab)" as never} />;
}
