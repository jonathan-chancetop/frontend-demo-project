import {Listener, loading, LocationChangedEvent, register, callAJAX, Handler, actionCreator} from "core-fe";
import {put} from "redux-saga/effects";
import productAJAXService from "service/ProductAJAXWebService";
import {CreateProductConfigResponse} from "type/api";
import AddProduct from "./component/AddProduct";
import ProductList from "./component/ProductList";
import {LOADING_PRODUCT_LIST, State} from "./type";
import {SagaIterator} from "redux-saga";

const initialState: State = {
    createProductUI: {
        types: [],
        now: null,
    },
};

class ActionHandler extends Handler<State> implements Listener {
    constructor() {
        super("product", initialState);
    }

    *loadCreateProductConfig(): SagaIterator {
        const effect = callAJAX(productAJAXService.createConfig);
        yield effect;
        const response = effect.response();
        yield put(actions.populateCreateProductConfig(response));
    }

    @loading(LOADING_PRODUCT_LIST)
    *loadProductList(): SagaIterator {
        yield callAJAX(productAJAXService.list);
    }

    populateCreateProductConfig(response: CreateProductConfigResponse): State {
        const types = response.types.map(type => {
            return {name: type.name, value: type.value};
        });
        return {
            ...this.state(),
            createProductUI: {types, now: response.now},
        };
    }

    *onLocationChanged(event: LocationChangedEvent) {
        if (event.location.pathname === "/product/add") {
            yield put(actions.loadCreateProductConfig());
        } else if (event.location.pathname === "/product/list") {
            yield put(actions.loadProductList());
        }
    }

    // @interval(3)
    // * onTick() {
    //     console.log("from product module, print every 3 secs");
    // }
}

const handler = new ActionHandler();
const actions = actionCreator(handler);
register(handler);
export {actions, AddProduct, ProductList};
