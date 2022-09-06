import { withProjectBuildGradle } from '@expo/config-plugins';
import {
  createGeneratedHeaderComment,
  MergeResults,
  removeGeneratedContents,
} from '@expo/config-plugins/build/utils/generateCode';
import { ExpoConfig } from '@expo/config-types';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_LEVEL_GRADLE = 'braze-project-level-build-extras.gradle';

const appendContents = ({
  src,
  newSrc,
  tag,
  comment,
}: {
  src: string;
  newSrc: string;
  tag: string;
  comment: string;
}): MergeResults => {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    // Ensure the old generated contents are removed.
    const sanitizedTarget = removeGeneratedContents(src, tag);
    const contentsToAdd = [
      // @something
      header,
      // contents
      newSrc,
      // @end
      `${comment} @generated end ${tag}`,
    ].join('\n');

    return {
      contents: sanitizedTarget ?? src + '\n' + contentsToAdd,
      didMerge: true,
      didClear: !!sanitizedTarget,
    };
  }
  return { contents: src, didClear: false, didMerge: false };
};

const appendContentsFromFile = async (config: any, tag: string) => {
  if (config.modResults.language === 'groovy') {
    const src = config.modResults.contents;
    const appendedContents = appendContents({
      tag,
      src,
      newSrc: `
      allprojects { 
        repositories { 
          maven { url "https://appboy.github.io/appboy-android-sdk/sdk" } 
        } 
      }
      buildscript {
          ext {
              // Set the kotlin version used in the Braze React SDK's buildscript
              if (findProperty('android.kotlinVersion')) {
                  kotlin_version = findProperty('android.kotlinVersion')
              } else {
                  kotlin_version = "1.6.0"
              }
          }
        repositories {
          google()
          mavenCentral()
        }
        dependencies { 
          classpath 'com.google.gms:google-services:4.3.4'
          classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version")
        } 
      }`,
      comment: '//',
    });
    config.modResults.contents = appendedContents.contents;
  } else {
    throw new Error(
      'Cannot add maven gradle because the build.gradle is not in groovy',
    );
  }
  return config;
};

export const withProjectLevelGradle: (configOuter: ExpoConfig) => ExpoConfig = (
  configOuter,
) => {
  const newConfig = withProjectBuildGradle(configOuter, async (config) => {
    return await appendContentsFromFile(
      config,
      'react-native-braze-sdk-import',
    );
  });

  return newConfig;
};
