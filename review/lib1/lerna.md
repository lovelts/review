## lerna 多包管理

lernaJs是由Babel团队出的一个多包管理工具。因为Babel包含很多子包，以前都是放在多个仓库里的，管理比较困难，特别是有调用系统内包的时候，发布比较麻烦。所以为了能更好更快的夸包管理，babel推出了lernaJs，使用了monorepo的概念，现在React,Babel,Angular,Jest都在使用这个工具来管理包。

初始化： 
lerna init

lerna add <package>

```shell
lerna add <moduleName>  // 所有子包都添加这个依赖
lerna add <moduleName> --scope = <pkgName> // 给scope后的包添加依赖
lerna add <pkgName1> --scope = <pkgName2> // 给pkgName2中添加pkgName1，包内的互相引用，会复制pkgName1到pkgName2中
```

原理：
动态软连