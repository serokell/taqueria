---
title: Understanding Taqueria Plugins
---

Plugins are how Taqueria gets things done. Each plugin implements a specific function such as a smart contract compiler, sandbox, or test framework. A plugin will provide one or more tasks that yo4u can use in Taqueria

Currently Taqueria offers the following core plugins:
- `taqueria/plugin-ligo` - A compiler for the LIGO smart contract language
- `taqueria/plugin-smartpy` - A compiler for the SmartPy contract language
- `taqueria/plugin-flextesa` - A sandbox test network running Tezos Flextesa 
- `taqueria/plugin-taquito` - A front-end Tezos framework used to originate
- `taqueria/plugin-ts-generator' - A type generator that produces TS types from Michelson code

Taqueria is designed to be flexible, streamlined, and customizable so plugins are installed on a per-project basis depending on the particular needs of the project

Once installed, plugins provide their functionality by exposing tasks in the Taqueria CLI. The tasks available to run on a particular project can be viewed by running the `taq --help` command in a project directory that's using Taqueria. 

:::note
If you aren't seeing tasks listed when running `taq`, make sure that you are in the correct project folder and that you have successfully installed that particular plugin on that project `taq install @taqueria/[INSERT_PLUGIN_NAME]
:::

During installation, NPM packages for the plugin are downloaded into the project folder and the plugin is registered in `./.taq/config.json`

Currently available plugins and their associated pluginName used for installation:

| name         |  pluginName                  |
|--------------|------------------------------|
| LIGO         | `@taqueria/plugin-ligo`      |
| SmartPy      | `@taqueria/plugin-smartpy`   |
| Flextesa     | `@taqueria/plugin-flextesa`  |
| Taquito      | `@taqueria/plugin/taquito`   |
| TS Generator | ***Coming soon***            |