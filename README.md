chaise
===

The node.js twitter listener service for couch. Yu huh.

## Requirements

* New-ish version of node.js. (suggest using brew to install on OS X: `brew install node`)

# Installing (running locally)

```
    $ npm i
    $ npm start
```

# Deploying

This app uses dokku on an ec2 instance. You'll need to have key permissions to push. Pushing works just like Heroku:

Add the git remote repo:
```
   $ git remote add aws dokku@ec2-54-201-2-181.us-west-2.compute.amazonaws.com:couch
```

Then push the branch:

```
   $ git push aws master
```

Voila!