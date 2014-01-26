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

# SSH Access

The following instructions assume assumes the EC2 instance IP is `54.200.49.88`.

`ssh -i <your AWS key file> ubuntu@54.200.49.88`

# Deploying

This app uses dokku on an ec2 instance (app name: `couch`). You'll need to have key permissions to push. Pushing works just like Heroku:

Add the git remote repo:
```
   $ git remote add aws dokku@54.200.49.88:couch
```

Then push the branch:

```
   $ git push aws master
```

# Debugging

SSH into the server. Then use `dokku` to access the node-js app container.

To get logs, for example: `dokku logs couch`


Voila!
