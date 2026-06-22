import { ShieldAlertIcon } from "lucide-react";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { SignInForm } from "./sign-in-form";

export const UnauthenticatedView = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-full max-w-lg bg-muted p-4 rounded-xl">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <ShieldAlertIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Authentication Required</ItemTitle>
            <ItemDescription>
              Please sign in or create an account to access this resource.
            </ItemDescription>
          </ItemContent>
          <ItemActions className="w-full">
            <SignInForm />
          </ItemActions>
        </Item>
      </div>
    </div>
  );
};
