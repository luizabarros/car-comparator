import robotsParser from 'robots-parser';

export class RobotsChecker {
  private static async getRobotsTxt(url: string): Promise<string> {
    const baseUrl = new URL(url).origin;
    try {
      const response = await fetch(`${baseUrl}/robots.txt`);
      return await response.text();
    } catch {
      return '';
    }
  }

  static async isAllowed(url: string, userAgent = 'CarScraperBot/1.0'): Promise<boolean> {
    const robotsTxt = await this.getRobotsTxt(url);
    const robots = robotsParser(url, robotsTxt);
    
    return robots.isAllowed(url, userAgent);
  }

  static async getCrawlDelay(url: string): Promise<number> {
    const robotsTxt = await this.getRobotsTxt(url);
    const robots = robotsParser(url, robotsTxt);
    
    return robots.getCrawlDelay('CarScraperBot/1.0') || 1000;
  }
}