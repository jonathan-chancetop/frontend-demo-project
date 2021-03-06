import * as React from "react";
import {createAppContainer, createStackNavigator, NavigationActions, NavigationContainerComponent} from "react-navigation";
import {HomeComponent} from "./home";
import {LoginComponent} from "./login";
import {ProductListComponent} from "./product";

const MainNavigator = createStackNavigator({
    Home: {screen: HomeComponent},
    Login: {screen: LoginComponent},
    Product: {screen: ProductListComponent},
});

const AppContainer = createAppContainer(MainNavigator);

export class Navigation {
    // Registered root-level navigator
    // Ref: https://reactnavigation.org/docs/en/navigating-without-navigation-prop.html
    private static rootNavigator: NavigationContainerComponent;

    static switch(routeName: string) {
        Navigation.rootNavigator.dispatch(NavigationActions.navigate({routeName}));
    }

    static rootRouter(): React.ReactNode {
        return <AppContainer ref={(_: NavigationContainerComponent) => (Navigation.rootNavigator = _)} />;
    }
}
