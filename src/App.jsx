import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import CodeReviewPage from '@/views';

const App = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/code-review" component={CodeReviewPage} />
      <Redirect from="/" to="/code-review?id=abc12345" />
    </Switch>
  </BrowserRouter>
);

export default App;
