## structure

### as cogs are added we add one file into here, cog_name.ts which contains both index and colormap info. These inherit a common structure from types.ts.

### we add this file to cog_configs.ts for it to be registered.

### Then components/SideBar.tsx has all it needs to render the legend, without any hardcoded cog-specific code that needs to be duplicated and edited each time a new cog is registered.
